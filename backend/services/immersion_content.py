import json
import os

import anthropic

LANGUAGE_NAMES = {
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese (Mandarin)",
    "pt": "Portuguese",
    "it": "Italian",
    "ar": "Arabic",
}

CONTENT_PROMPTS = {
    "dialogue": "Create a short, natural 2-person conversation (4-8 exchanges) about {topic}. Use realistic speech patterns for {level_desc} level learners. Include filler words and natural hesitations.",
    "news": "Write a short news summary (3-5 sentences) about {topic}. Calibrate vocabulary and grammar for {level_desc} level learners.",
    "cultural": "Write a short cultural explainer (3-5 sentences) about {topic} relevant to {region_or_default} culture. Target {level_desc} level learners.",
    "overheard": "Simulate an overheard conversation snippet (3-6 exchanges) between strangers discussing {topic}. Make it feel like you're catching the middle of a conversation. Use natural, casual speech for {level_desc} level.",
    "slang": "Create a street language lesson about {topic}. Include 3-5 slang expressions with examples. Mark any profanity. Target {region_or_default} dialect. Include: filler words, texting abbreviations, and casual register examples. Level: {level_desc}.",
}

LEVEL_DESCRIPTIONS = {
    1: "absolute beginner (A1 - basic greetings only)",
    2: "beginner (A1 - simple phrases)",
    3: "elementary (A2 - basic sentences)",
    4: "pre-intermediate (A2-B1)",
    5: "intermediate (B1)",
    6: "upper-intermediate (B1-B2)",
    7: "advanced (B2)",
    8: "upper-advanced (B2-C1)",
    9: "near-native (C1)",
    10: "native-level (C2 - includes idioms, slang, complex grammar)",
}


async def generate_immersion_content(
    topic: str,
    difficulty_level: int,
    content_type: str,
    language: str,
    region: str | None = None,
) -> dict:
    """Generate immersion content using Claude."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    client = anthropic.AsyncAnthropic(api_key=api_key)
    lang_name = LANGUAGE_NAMES.get(language, language)
    level_desc = LEVEL_DESCRIPTIONS.get(difficulty_level, "intermediate (B1)")
    region_or_default = region or "general"

    content_prompt = CONTENT_PROMPTS[content_type].format(
        topic=topic,
        level_desc=level_desc,
        region_or_default=region_or_default,
    )

    system_prompt = f"""You are a {lang_name} language content generator for immersion learning.

Generate content in {lang_name} with these rules:
1. ALL main content must be in {lang_name}
2. Tag vocabulary by difficulty (1-10)
3. Provide a full English translation
4. For "slang" content, flag if it contains profanity

Respond ONLY with valid JSON in this exact format:
{{
  "text": "<the {lang_name} content>",
  "translation": "<full English translation>",
  "vocabulary": [
    {{"word": "<{lang_name} word>", "meaning": "<English meaning>", "difficulty": <1-10>}},
    ...
  ],
  "audio_text": "<clean version of text optimized for TTS reading, no labels or formatting>",
  "has_profanity": false
}}

For dialogues/conversations, use A: and B: labels in the text.
For audio_text, provide a natural reading version without speaker labels.
Include 5-10 vocabulary items, focusing on words at or near difficulty level {difficulty_level}."""

    message = await client.messages.create(
        model="claude-3-5-haiku-latest",
        max_tokens=1500,
        system=system_prompt,
        messages=[{"role": "user", "content": content_prompt}],
    )

    raw = message.content[0].text.strip()
    # Extract JSON from potential markdown code blocks
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])

    return json.loads(raw)


async def translate_single_word(word: str, language: str, context: str = "") -> dict:
    """Translate a single word using Claude."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    client = anthropic.AsyncAnthropic(api_key=api_key)
    lang_name = LANGUAGE_NAMES.get(language, language)

    context_note = f' in the context: "{context}"' if context else ""

    message = await client.messages.create(
        model="claude-3-5-haiku-latest",
        max_tokens=200,
        system=f"Translate {lang_name} words to English. Respond ONLY with valid JSON.",
        messages=[
            {
                "role": "user",
                "content": f'Translate the {lang_name} word "{word}"{context_note}. Return JSON: {{"word": "{word}", "translation": "...", "part_of_speech": "...", "example": "..."}}',
            }
        ],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])

    return json.loads(raw)
