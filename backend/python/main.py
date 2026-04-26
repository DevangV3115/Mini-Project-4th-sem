import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from engine import SelfCorrectingEngine
import sqlite3

# DB connect
conn = sqlite3.connect("users.db", check_same_thread=False)
cursor = conn.cursor()

# table create
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
)
""")
conn.commit()

# ── Structured Logging ──────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s | %(name)-18s | %(levelname)-7s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("reasoning-api")

engine = None
request_count = 0
total_latency = 0.0


# ── Rate Limiting (in-memory, per-IP) ──────────────────────────────
class RateLimiter:
    """Simple in-memory sliding-window rate limiter."""

    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._hits: dict[str, list[float]] = {}

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        hits = self._hits.setdefault(key, [])
        # Remove expired entries
        hits[:] = [t for t in hits if now - t < self.window]
        if len(hits) >= self.max_requests:
            return False
        hits.append(now)
        return True


rate_limiter = RateLimiter(max_requests=20, window_seconds=60)


# ── Lifespan ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    logger.info("Initializing Self-Correcting Reasoning Engine...")
    engine = SelfCorrectingEngine()
    logger.info("Engine ready. Server accepting requests.")
    yield
    logger.info("Shutting down engine.")


app = FastAPI(
    title="Self-Correcting Reasoning API",
    description="API for multi-path reasoning with self-correction and consensus verification.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.netlify.app",
    "https://*.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Kept permissive for dev; restrict in production
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)


# ── Security Headers Middleware ────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# ── Rate Limit Middleware ──────────────────────────────────────────
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for {client_ip}")
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."},
        )
    return await call_next(request)


# ── Request Models ─────────────────────────────────────────────────
class SolveRequest(BaseModel):
    """Input validation for the /solve endpoint."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="The question to reason about",
        examples=["What is 25 * 4?", "Explain self-correcting reasoning"],
    )


class FeedbackRequest(BaseModel):
    """User feedback on reasoning quality."""

    chat_id: str = Field(..., description="The chat session ID")
    user_id: str = Field(..., description="The user's Firebase UID")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    comments: str = Field(default="", max_length=1000, description="Optional comments")
    step_id: int | None = Field(
        default=None, description="Optional specific reasoning step ID"
    )


# ── Endpoints ──────────────────────────────────────────────────────
@app.get("/health")
async def health():
    """Health check endpoint with system metrics."""
    return {
        "status": "ok",
        "engine_ready": engine is not None,
        "total_requests": request_count,
        "avg_latency_ms": (
            round((total_latency / request_count) * 1000, 2) if request_count > 0 else 0
        ),
    }


@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Accept user feedback on reasoning outputs."""
    logger.info(
        f"Feedback received: chat={feedback.chat_id} user={feedback.user_id} "
        f"rating={feedback.rating}/5 step={feedback.step_id}"
    )
    # In production, persist to database
    return {
        "status": "success",
        "message": "Feedback recorded. Thank you!",
        "chat_id": feedback.chat_id,
    }


@app.post("/solve")
async def solve(body: SolveRequest):
    """Run the self-correcting reasoning engine and stream results via SSE."""
    global request_count, total_latency

    question = body.question
    logger.info(f"Solve request: '{question[:80]}...'")
    start_time = time.time()

    async def event_stream():
        global request_count, total_latency
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue = asyncio.Queue()

        def step_callback(event):
            loop.call_soon_threadsafe(queue.put_nowait, event)

        async def run_engine():
            try:
                await asyncio.to_thread(engine.solve, question, step_callback)
            except Exception as e:
                import traceback

                traceback.print_exc()
                logger.error(f"Engine error: {e}")
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    {
                        "type": "answer",
                        "data": {"content": f"**Backend Error:** {str(e)}"},
                    },
                )
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        task = asyncio.create_task(run_engine())

        # Send total steps first so frontend knows the expected count
        yield f"data: {json.dumps({'type': 'total_steps', 'data': engine.total_steps})}\n\n"

        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"

        await task

        # Track metrics
        elapsed = time.time() - start_time
        request_count += 1
        total_latency += elapsed
        logger.info(f"Solve completed in {elapsed:.2f}s")

    return StreamingResponse(event_stream(), media_type="text/event-stream")

from fastapi import HTTPException

@app.post("/signup")
async def signup(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing fields")

    try:
        cursor.execute(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            (email, password)
        )
        conn.commit()
        return {"message": "Signup success"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists")


@app.post("/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing fields")

    cursor.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (email, password)
    )
    user = cursor.fetchone()

    if user:
        return {"message": "Login success"}

    raise HTTPException(status_code=401, detail="Invalid credentials")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
