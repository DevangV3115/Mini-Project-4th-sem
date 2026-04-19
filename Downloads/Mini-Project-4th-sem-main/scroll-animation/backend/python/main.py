import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import InvalidTokenError
from pydantic import BaseModel, Field

from engine import SelfCorrectingEngine
from metrics_store import MetricsStore
from rate_limit import FixedWindowRateLimiter

engine = None
metrics_store = MetricsStore(db_path=os.getenv("METRICS_DB_PATH", "data/metrics.db"))
security = HTTPBearer(auto_error=False)
rate_limiter = FixedWindowRateLimiter()

SOLVE_RATE_LIMIT_PER_MIN = int(os.getenv("SOLVE_RATE_LIMIT_PER_MIN", "30"))
METRICS_LOG_RATE_LIMIT_PER_MIN = int(os.getenv("METRICS_LOG_RATE_LIMIT_PER_MIN", "120"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("reasoning-api")


class SolveRequest(BaseModel):
    question: str = Field(min_length=3, max_length=4000)


class MetricsLogRequest(BaseModel):
    timestamp: str = Field(description="ISO-8601 timestamp")
    user_id: str | None = Field(default=None, max_length=128)
    session_id: str | None = Field(default=None, max_length=128)
    model_name: str | None = Field(default=None, max_length=128)
    latency_ms: float = Field(ge=0, le=120000)
    accuracy_score: float | None = Field(default=None, ge=0, le=1)
    correction_iterations: int = Field(ge=0, le=20)
    confidence_score: float | None = Field(default=None, ge=0, le=1)
    is_failure: bool = Field(default=False)
    failure_reason: str | None = Field(default=None, max_length=1000)


def _verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> dict[str, str]:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing bearer token",
        )

    token = credentials.credentials
    jwt_secret = os.getenv("API_JWT_SECRET")
    if jwt_secret:
        try:
            claims = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            return {
                "token": token,
                "role": str(claims.get("role", "")),
                "subject": str(claims.get("sub", "")),
            }
        except InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid bearer token",
            )

    expected = os.getenv("API_BEARER_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_BEARER_TOKEN or API_JWT_SECRET must be configured",
        )
    if token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
        )
    return {"token": token, "role": ""}


def require_role(required: str):
    def dependency(
        token_ctx: Annotated[dict[str, str], Depends(_verify_token)],
        x_role: Annotated[str | None, Header()] = None,
    ) -> str:
        role = token_ctx.get("role") or x_role
        if role != required:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required}' required",
            )
        return role

    return dependency


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    engine = SelfCorrectingEngine()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.middleware("http")
async def request_observability(request: Request, call_next):
    start = time.perf_counter()
    request_id = request.headers.get("x-request-id", f"req-{int(time.time() * 1000)}")

    path_limits: dict[tuple[str, str], int] = {
        ("POST", "/solve"): SOLVE_RATE_LIMIT_PER_MIN,
        ("POST", "/metrics/log"): METRICS_LOG_RATE_LIMIT_PER_MIN,
    }
    limit = path_limits.get((request.method, request.url.path))
    if limit is not None:
        forwarded_for = request.headers.get("x-forwarded-for", "")
        ip = (forwarded_for.split(",")[0].strip() if forwarded_for else None) or (
            request.client.host if request.client else "unknown"
        )
        allowed, retry_after = rate_limiter.allow(
            key=f"{request.method}:{request.url.path}:{ip}",
            limit=limit,
            window_seconds=60,
        )
        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded", "request_id": request_id},
                headers={"Retry-After": str(retry_after)},
            )

    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.exception(
            "request_failed",
            extra={"request_id": request_id, "path": request.url.path, "latency_ms": round(elapsed_ms, 2)},
        )
        raise

    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    logger.info(
        "request_completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": round(elapsed_ms, 2),
        },
    )
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "engine_ready": engine is not None}


@app.post("/solve")
async def solve(payload: SolveRequest):
    question = payload.question.strip()

    async def event_stream():
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
                loop.call_soon_threadsafe(
                    queue.put_nowait, 
                    {"type": "answer", "data": {"content": f"**Backend Crash:** {str(e)}"}}
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

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/metrics/log", dependencies=[Depends(require_role("admin"))])
async def log_metrics(payload: MetricsLogRequest):
    record = payload.model_dump()
    # Normalize timestamp format at ingestion to keep analytics queries deterministic.
    if record["timestamp"].lower() == "now":
        record["timestamp"] = datetime.now(timezone.utc).isoformat()
    record_id = metrics_store.log_metric(record)
    return {"status": "logged", "metric_id": record_id}


@app.get("/metrics/summary", dependencies=[Depends(require_role("admin"))])
async def metrics_summary():
    return metrics_store.summary()


@app.get("/metrics/rate-limit-status", dependencies=[Depends(require_role("admin"))])
async def metrics_rate_limit_status():
    entries = rate_limiter.snapshot(window_seconds=RATE_LIMIT_WINDOW_SECONDS)
    by_route: dict[str, int] = {
        "POST:/solve": 0,
        "POST:/metrics/log": 0,
    }
    for entry in entries:
        key = str(entry["key"])
        method, path, _ip = key.split(":", 2)
        route_key = f"{method}:{path}"
        by_route[route_key] = by_route.get(route_key, 0) + int(entry["count"])

    return {
        "window_seconds": RATE_LIMIT_WINDOW_SECONDS,
        "configured_limits_per_min": {
            "POST:/solve": SOLVE_RATE_LIMIT_PER_MIN,
            "POST:/metrics/log": METRICS_LOG_RATE_LIMIT_PER_MIN,
        },
        "active_bucket_count": len(entries),
        "active_request_counts": by_route,
        "entries": entries,
    }
