import json
import time
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.claude import generate_script
from services.tts import generate_audio

router = APIRouter()

OUTPUT_DIR = Path(__file__).parent.parent / "output"
EPISODES_FILE = OUTPUT_DIR / "episodes.json"


class CardInput(BaseModel):
    question: str
    answer: str


class GenerateRequest(BaseModel):
    title: str
    cards: list[CardInput]


class Episode(BaseModel):
    id: str
    title: str
    cards: list[CardInput]
    script: str
    audioUrl: str
    durationEstimate: int  # seconds (estimated from script length)
    createdAt: float  # unix timestamp


def _load_episodes() -> list[dict]:
    if not EPISODES_FILE.exists():
        return []
    return json.loads(EPISODES_FILE.read_text())


def _save_episodes(episodes: list[dict]) -> None:
    EPISODES_FILE.write_text(json.dumps(episodes, indent=2))


@router.post("/generate", response_model=Episode)
async def generate_episode(req: GenerateRequest):
    """Generate a podcast episode from flashcard content."""
    if not req.cards:
        raise HTTPException(status_code=400, detail="At least one card is required")

    episode_id = str(uuid4())

    # Step 1: Generate script with Claude
    cards_data = [{"question": c.question, "answer": c.answer} for c in req.cards]
    script = await generate_script(cards_data, req.title)

    # Step 2: Generate audio with Edge TTS
    OUTPUT_DIR.mkdir(exist_ok=True)
    audio_path = await generate_audio(script, OUTPUT_DIR, episode_id)

    # Estimate duration from file size (~16kbps for edge-tts MP3)
    file_size = audio_path.stat().st_size
    duration_estimate = max(30, file_size // 2000)  # rough estimate

    episode = Episode(
        id=episode_id,
        title=req.title,
        cards=req.cards,
        script=script,
        audioUrl=f"/audio/{episode_id}.mp3",
        durationEstimate=duration_estimate,
        createdAt=time.time(),
    )

    # Persist episode metadata
    episodes = _load_episodes()
    episodes.append(episode.model_dump())
    _save_episodes(episodes)

    return episode


@router.get("/episodes", response_model=list[Episode])
async def list_episodes():
    """List all generated episodes."""
    episodes = _load_episodes()
    # Sort by newest first
    episodes.sort(key=lambda e: e.get("createdAt", 0), reverse=True)
    return episodes


@router.get("/episodes/{episode_id}", response_model=Episode)
async def get_episode(episode_id: str):
    """Get a specific episode by ID."""
    episodes = _load_episodes()
    for ep in episodes:
        if ep["id"] == episode_id:
            return ep
    raise HTTPException(status_code=404, detail="Episode not found")


@router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: str):
    """Delete an episode and its audio file."""
    episodes = _load_episodes()
    remaining = [ep for ep in episodes if ep["id"] != episode_id]
    if len(remaining) == len(episodes):
        raise HTTPException(status_code=404, detail="Episode not found")

    # Delete audio file
    audio_file = OUTPUT_DIR / f"{episode_id}.mp3"
    if audio_file.exists():
        audio_file.unlink()

    _save_episodes(remaining)
    return {"deleted": True}
