import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import audio, immersion

app = FastAPI(title="Aretee Audio Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure output directory exists
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Serve generated audio files
app.mount("/audio", StaticFiles(directory=str(OUTPUT_DIR)), name="audio")

app.include_router(audio.router, prefix="/api/audio", tags=["audio"])
app.include_router(immersion.router, prefix="/api/immersion", tags=["immersion"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
