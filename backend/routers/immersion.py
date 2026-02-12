import json
import time
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.immersion_content import generate_immersion_content
from services.tts import synthesize_segment

router = APIRouter()

OUTPUT_DIR = Path(__file__).parent.parent / "output"
FEED_FILE = OUTPUT_DIR / "immersion_feed.json"

CONTENT_TYPES = ["dialogue", "news", "cultural", "overheard", "slang"]


class GenerateRequest(BaseModel):
    topic: str = "daily life"
    difficulty_level: int = 5  # 1-10
    content_type: str = "dialogue"
    language: str = "es"  # target language code
    region: str | None = None  # e.g. "Mexico", "Spain", "Argentina"


class VocabItem(BaseModel):
    word: str
    meaning: str
    difficulty: int  # 1-10


class ImmersionItem(BaseModel):
    id: str
    content_type: str
    text: str
    translation: str
    vocabulary: list[VocabItem]
    audio_text: str
    audio_url: str | None = None
    topic: str
    difficulty_level: int
    language: str
    region: str | None = None
    has_profanity: bool = False
    created_at: float


class TranslateRequest(BaseModel):
    word: str
    language: str = "es"
    context: str = ""


class TranslateResponse(BaseModel):
    word: str
    translation: str
    part_of_speech: str
    example: str


def _load_feed() -> list[dict]:
    if not FEED_FILE.exists():
        return []
    return json.loads(FEED_FILE.read_text())


def _save_feed(items: list[dict]) -> None:
    FEED_FILE.write_text(json.dumps(items, indent=2))


@router.post("/generate", response_model=ImmersionItem)
async def generate_item(req: GenerateRequest):
    """Generate a single immersion feed item."""
    if req.content_type not in CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content_type. Must be one of: {CONTENT_TYPES}",
        )
    if not 1 <= req.difficulty_level <= 10:
        raise HTTPException(status_code=400, detail="difficulty_level must be 1-10")

    item_id = str(uuid4())

    # Generate content with Claude
    result = await generate_immersion_content(
        topic=req.topic,
        difficulty_level=req.difficulty_level,
        content_type=req.content_type,
        language=req.language,
        region=req.region,
    )

    # Generate audio
    OUTPUT_DIR.mkdir(exist_ok=True)
    audio_path = OUTPUT_DIR / f"immersion_{item_id}.mp3"

    # Pick voice based on language
    voice_map = {
        "es": "es-MX-DaliaNeural",
        "fr": "fr-FR-DeniseNeural",
        "de": "de-DE-KatjaNeural",
        "ja": "ja-JP-NanamiNeural",
        "ko": "ko-KR-SunHiNeural",
        "zh": "zh-CN-XiaoxiaoNeural",
        "pt": "pt-BR-FranciscaNeural",
        "it": "it-IT-ElsaNeural",
        "ar": "ar-SA-ZariyahNeural",
    }
    voice = voice_map.get(req.language, "es-MX-DaliaNeural")

    # Regional voice overrides for Spanish
    if req.language == "es" and req.region:
        region_voices = {
            "Spain": "es-ES-ElviraNeural",
            "Argentina": "es-AR-ElenaNeural",
            "Mexico": "es-MX-DaliaNeural",
            "Colombia": "es-CO-SalomeNeural",
        }
        voice = region_voices.get(req.region, voice)

    try:
        await synthesize_segment(result["audio_text"], voice, audio_path)
        audio_url = f"/audio/immersion_{item_id}.mp3"
    except Exception:
        audio_url = None

    item = ImmersionItem(
        id=item_id,
        content_type=req.content_type,
        text=result["text"],
        translation=result["translation"],
        vocabulary=[VocabItem(**v) for v in result["vocabulary"]],
        audio_text=result["audio_text"],
        audio_url=audio_url,
        topic=req.topic,
        difficulty_level=req.difficulty_level,
        language=req.language,
        region=req.region,
        has_profanity=result.get("has_profanity", False),
        created_at=time.time(),
    )

    # Persist
    feed = _load_feed()
    feed.append(item.model_dump())
    _save_feed(feed)

    return item


@router.post("/generate-batch", response_model=list[ImmersionItem])
async def generate_batch(req: GenerateRequest, count: int = 5):
    """Generate multiple feed items at once."""
    items = []
    for _ in range(min(count, 10)):
        item = await generate_item(req)
        items.append(item)
    return items


@router.post("/translate", response_model=TranslateResponse)
async def translate_word(req: TranslateRequest):
    """Translate a single word with context."""
    from services.immersion_content import translate_single_word

    result = await translate_single_word(req.word, req.language, req.context)
    return TranslateResponse(**result)


@router.get("/feed", response_model=list[ImmersionItem])
async def get_feed(limit: int = 20, offset: int = 0):
    """Get cached feed items."""
    feed = _load_feed()
    feed.sort(key=lambda x: x.get("created_at", 0), reverse=True)
    return feed[offset : offset + limit]
