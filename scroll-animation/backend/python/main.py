import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from engine import SelfCorrectingEngine

engine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    engine = SelfCorrectingEngine()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "engine_ready": engine is not None}


@app.post("/solve")
async def solve(request: Request):
    body = await request.json()
    question = body.get("question", "")

    if not question:
        return {"error": "No question provided"}

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
