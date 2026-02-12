import re
from pathlib import Path

import edge_tts

# Voice assignments for the two speakers
LEARNER_VOICE = "en-US-JennyNeural"
EXPERT_VOICE = "en-US-GuyNeural"


def parse_script(script: str) -> list[dict[str, str]]:
    """Parse a podcast script into speaker/text segments."""
    segments: list[dict[str, str]] = []
    for line in script.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        match = re.match(r"^(LEARNER|EXPERT):\s*(.+)$", line)
        if match:
            segments.append({
                "speaker": match.group(1),
                "text": match.group(2),
            })
    return segments


async def synthesize_segment(text: str, voice: str, output_path: Path) -> None:
    """Synthesize a single text segment to an MP3 file."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(output_path))


async def generate_audio(script: str, output_dir: Path, episode_id: str) -> Path:
    """Generate a full audio episode from a script.

    Concatenates all segments into a single MP3 file.
    """
    segments = parse_script(script)
    if not segments:
        raise ValueError("No valid segments found in script")

    temp_dir = output_dir / f"_temp_{episode_id}"
    temp_dir.mkdir(exist_ok=True)

    segment_files: list[Path] = []

    for i, segment in enumerate(segments):
        voice = LEARNER_VOICE if segment["speaker"] == "LEARNER" else EXPERT_VOICE
        seg_path = temp_dir / f"seg_{i:03d}.mp3"
        await synthesize_segment(segment["text"], voice, seg_path)
        segment_files.append(seg_path)

    # Concatenate all MP3 segments (simple binary concatenation works for MP3)
    final_path = output_dir / f"{episode_id}.mp3"
    with open(final_path, "wb") as outfile:
        for seg_path in segment_files:
            outfile.write(seg_path.read_bytes())

    # Cleanup temp files
    for seg_path in segment_files:
        seg_path.unlink()
    temp_dir.rmdir()

    return final_path
