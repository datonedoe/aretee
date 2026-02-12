import os

import anthropic


SCRIPT_SYSTEM_PROMPT = """Generate a 3-5 minute conversational podcast script about the following concepts. Two speakers: a curious learner (LEARNER) and a knowledgeable friend (EXPERT).

Style: Casual, engaging, like two friends at a coffee shop.
Include: Real-world examples, analogies, "aha" moments.
End with: A thought-provoking question for the listener.

Format your response as a script with speaker labels. Each line should start with either LEARNER: or EXPERT: followed by their dialogue. Do not include stage directions or sound effects.

Example format:
LEARNER: Hey, I've been trying to understand this concept...
EXPERT: Oh, that's a great one! Let me break it down for you...

Keep each speaker turn to 1-3 sentences for natural conversation flow. Aim for roughly 20-30 exchanges total."""


async def generate_script(cards: list[dict[str, str]], title: str) -> str:
    """Generate a podcast script from flashcard content using Claude."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    client = anthropic.AsyncAnthropic(api_key=api_key)

    concepts = "\n".join(
        f"- {card['question']}: {card['answer']}" for card in cards
    )

    user_message = f"Episode title: {title}\n\nConcepts to cover:\n{concepts}"

    message = await client.messages.create(
        model="claude-3-5-haiku-latest",
        max_tokens=2048,
        system=SCRIPT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    return message.content[0].text
