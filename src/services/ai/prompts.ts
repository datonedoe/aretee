export function buildSocraticSystemPrompt(
  question: string,
  answer: string,
  ease: number
): string {
  const difficultyGuide = getDifficultyGuide(ease)

  return `You are Socrates, engaging in dialectic with a student.
Your goal is NOT to teach — it is to help them discover truth through questions.

Rules:
- Never give the answer directly
- Ask ONE question at a time
- Start from what they think they know
- Gently expose contradictions
- When they reach understanding, acknowledge it with genuine warmth
- Keep responses under 3 sentences
- Use simple, clear language
- If the student is clearly stuck after 3+ exchanges, offer a small hint wrapped in a question

Topic: ${question}
Known answer: ${answer}
Student's current mastery: ${ease}/400

${difficultyGuide}

When you detect that the student has reached genuine understanding (their response demonstrates they grasp the core concept), respond with exactly this format:
[INSIGHT] followed by a brief, warm acknowledgment of their discovery.

Example: [INSIGHT] Excellent — you've arrived at it yourself. That understanding will stick because you earned it.`
}

function getDifficultyGuide(ease: number): string {
  if (ease >= 300) {
    return `Difficulty: ADVANCED — This student knows this topic well. Challenge them with edge cases, deeper implications, or connections to other concepts. Push their thinking beyond surface understanding.`
  }
  if (ease >= 250) {
    return `Difficulty: INTERMEDIATE — This student has decent familiarity. Ask questions that probe their understanding of WHY and HOW, not just WHAT.`
  }
  if (ease >= 200) {
    return `Difficulty: DEVELOPING — This student is still building understanding. Start with foundational questions and build up gradually. Be encouraging.`
  }
  return `Difficulty: BEGINNER — This student is new to this concept. Start with the simplest possible question. Be patient and supportive. Use analogies to familiar things.`
}

export function buildOpeningQuestion(question: string, answer: string, ease: number): string {
  if (ease < 200) {
    return `Let's explore this together. When you hear "${question}", what comes to mind first?`
  }
  if (ease < 250) {
    return `I'd like to discuss something with you. Can you tell me — ${question}`
  }
  if (ease < 300) {
    return `Let me ask you this — ${question} And more importantly, why do you think that is?`
  }
  return `You seem familiar with this area. Let me challenge you: ${question} But can you explain the deeper principle at work here?`
}
