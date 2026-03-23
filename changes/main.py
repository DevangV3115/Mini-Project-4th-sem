import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, constr
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from engine import SelfCorrectingEngine

engine = None

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    engine = SelfCorrectingEngine()
    yield

app = FastAPI(lifespan=lifespan)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security Headers and CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be tightened in production
    allow_methods=["*"],
    allow_headers=["*"],
)

class SolveRequest(BaseModel):
    # Input validation
    question: constr(min_length=3, max_length=1000)

class FeedbackRequest(BaseModel):
    chat_id: str
    user_id: str
    rating: int # e.g. 1-5
    comments: str

@app.get("/health")
@limiter.limit("5/minute")
async def health(request: Request):
    """Enhanced Health Check with metrics"""
    import psutil
    memory_info = psutil.virtual_memory()
    return {
        "status": "ok", 
        "engine_ready": engine is not None,
        "memory_usage_percent": memory_info.percent,
        "total_paths_processed": engine.total_paths if hasattr(engine, 'total_paths') else 0
    }

@app.post("/feedback")
@limiter.limit("10/minute")
async def submit_feedback(request: Request, feedback: FeedbackRequest):
    """User Feedback Mechanism"""
    # Log feedback or store in DB (mocked for now)
    print(f"Feedback received for chat {feedback.chat_id} from {feedback.user_id}: {feedback.rating}/5. Comments: {feedback.comments}")
    return {"status": "success", "message": "Feedback recorded."}

@app.post("/solve")
@limiter.limit("10/minute")
async def solve(request: Request, body: SolveRequest):
    question = body.question
    
    if not question:
        raise HTTPException(status_code=400, detail="No question provided")

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
        yield f"data: {json.dumps({'type': 'total_steps', 'data': engine.total_steps})}\n\n"

        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"

        await task

    return StreamingResponse(event_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
