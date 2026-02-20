/**
 * Sprint 12: Deep Conversation Scenarios
 * Conversation engine — system prompts, branching logic, post-conversation review.
 */

import { sendMessage, sendMessageSync, Message, StreamCallbacks } from './client'
import {
  Character,
  Scenario,
  ConversationMessage,
  ConversationSession,
  ConversationReview,
  BranchPoint,
  RegisterLevel,
} from '../../types/conversation'

// ─── System Prompt Construction ──────────────────────────────────────────────

function buildConversationSystemPrompt(
  scenario: Scenario,
  character: Character,
  userLevel: number // 1-5 difficulty
): string {
  return `You are ${character.name}, a character in an immersive language-learning conversation scenario.

## Your Identity
- **Name:** ${character.name}
- **Personality:** ${character.personality}
- **Backstory:** ${character.backstory}
- **Default register:** ${character.defaultRegister}
- **Speech patterns:**
${character.speechPatterns.map((p) => `  - ${p}`).join('\n')}

## Scenario
${scenario.description}

## Rules
1. STAY IN CHARACTER at all times. You ARE ${character.name}.
2. Respond ONLY in Spanish. Never switch to English unless the user explicitly begs for help.
3. Keep responses 1-4 sentences. This is a conversation, not a monologue.
4. React NATURALLY to what the user says:
   - If they're rude → get offended, become cold, or push back (depending on your personality)
   - If they're funny → laugh, warm up, open up more
   - If they struggle → simplify slightly, but don't break character
   - If they use the wrong register → react as a real person would (confused, amused, offended)
5. Use your speech patterns consistently. Stay authentic.
6. Advance the scenario naturally — introduce complications, new topics, mini-conflicts.
7. ${getAdaptiveDifficultyInstruction(userLevel)}

## Branching Behavior
Your mood and openness shift based on how the user treats you:
- **Polite + correct register** → friendly, helpful, share more
- **Rude or dismissive** → cold, uncooperative, try to end the interaction
- **Funny/charming** → warm, personal, extend the conversation
- **Wrong register (too formal/informal)** → confused or amused reaction

## Output Format
Respond ONLY as ${character.name} would speak. No meta-commentary. No translations. No explanations.
If you detect a significant register mismatch, subtly model the correct register in your response (don't explain it — just use it naturally).`
}

function getAdaptiveDifficultyInstruction(level: number): string {
  if (level <= 1) {
    return 'ADAPTIVE: This is a beginner. Use simple vocabulary. Short sentences. Repeat key words. If they seem lost, offer a choice ("¿Quieres X o Y?").'
  }
  if (level <= 2) {
    return 'ADAPTIVE: This learner is developing. Use common vocabulary with occasional new words. Keep sentences moderate length.'
  }
  if (level <= 3) {
    return 'ADAPTIVE: This learner is intermediate. Use natural speech with idioms and colloquialisms. Don\'t simplify unless they clearly struggle.'
  }
  if (level <= 4) {
    return 'ADAPTIVE: This learner is advanced. Use full natural speech — slang, idioms, complex grammar. Challenge them.'
  }
  return 'ADAPTIVE: Expert-level learner. Go all out — regional expressions, double meanings, cultural references, rapid-fire conversation.'
}

// ─── Review Prompt ───────────────────────────────────────────────────────────

function buildReviewPrompt(
  scenario: Scenario,
  character: Character,
  messages: ConversationMessage[]
): string {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'LEARNER' : character.name}: ${m.content}`)
    .join('\n')

  return `You are a language-learning expert reviewing a conversation practice session.

## Context
- Scenario: ${scenario.title} (${scenario.description})
- Character: ${character.name} (register: ${character.defaultRegister})
- Target register: ${scenario.targetRegister}

## Transcript
${transcript}

## Task
Analyze the learner's performance and return ONLY valid JSON (no markdown, no code fences):

{
  "overallScore": <0-100>,
  "fluency": <0-100>,
  "accuracy": <0-100>,
  "registerAppropriateness": <0-100>,
  "vocabRange": <0-100>,
  "corrections": [
    {
      "original": "<what the learner said>",
      "corrected": "<better way to say it>",
      "explanation": "<brief explanation in English>"
    }
  ],
  "newVocab": ["<useful word/phrase from the conversation>"],
  "tips": ["<actionable tip for improvement>"]
}

Scoring guide:
- overallScore: Holistic assessment of conversational ability
- fluency: How naturally did the conversation flow? Did they keep up?
- accuracy: Grammar, vocabulary, and spelling correctness
- registerAppropriateness: Did they use the right formality level for the context?
- vocabRange: Variety and sophistication of vocabulary used

Keep corrections to the top 3-5 most important. Keep tips to 2-3 actionable items.
Include 3-5 new vocab items they encountered or should learn from this context.`
}

// ─── Conversation Engine ─────────────────────────────────────────────────────

/**
 * Start a new conversation session.
 */
export function startConversation(
  scenario: Scenario,
  character: Character
): ConversationSession {
  const openingMessage: ConversationMessage = {
    role: 'character',
    content: scenario.openingLine,
    timestamp: new Date(),
    characterId: character.id,
    registerUsed: character.defaultRegister,
  }

  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scenario,
    activeCharacter: character,
    messages: [openingMessage],
    startedAt: new Date(),
    duration: 0,
    branchPoints: [],
    review: null,
    xpEarned: 0,
  }
}

/**
 * Send a user message and get the character's streaming response.
 */
export async function sendConversationMessage(
  session: ConversationSession,
  userMessage: string,
  userLevel: number,
  callbacks: StreamCallbacks
): Promise<{
  updatedSession: ConversationSession
  branchDetected: BranchPoint | null
}> {
  const { scenario, activeCharacter, messages } = session

  const systemPrompt = buildConversationSystemPrompt(
    scenario,
    activeCharacter,
    userLevel
  )

  // Build API message history
  const apiMessages: Message[] = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  // Add the new user message
  apiMessages.push({ role: 'user', content: userMessage })

  const userMsg: ConversationMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  }

  let branchDetected: BranchPoint | null = null
  let fullResponseText = ''

  const wrappedCallbacks: StreamCallbacks = {
    onToken: callbacks.onToken,
    onComplete: (fullText: string) => {
      fullResponseText = fullText
      // Detect branch points based on sentiment shifts
      branchDetected = detectBranchPoint(
        userMessage,
        fullText,
        messages.length
      )
      callbacks.onComplete(fullText)
    },
    onError: callbacks.onError,
  }

  await sendMessage(systemPrompt, apiMessages, wrappedCallbacks)

  const characterMsg: ConversationMessage = {
    role: 'character',
    content: fullResponseText,
    timestamp: new Date(),
    characterId: activeCharacter.id,
  }

  const updatedMessages = [...messages, userMsg, characterMsg]
  const newBranchPoints = branchDetected
    ? [...session.branchPoints, branchDetected]
    : session.branchPoints

  const now = new Date()
  const duration = Math.floor(
    (now.getTime() - session.startedAt.getTime()) / 1000
  )

  const updatedSession: ConversationSession = {
    ...session,
    messages: updatedMessages,
    duration,
    branchPoints: newBranchPoints,
  }

  return { updatedSession, branchDetected }
}

/**
 * Generate a post-conversation review.
 */
export async function generateConversationReview(
  session: ConversationSession
): Promise<ConversationReview> {
  const { scenario, activeCharacter, messages } = session

  const reviewPrompt = buildReviewPrompt(scenario, activeCharacter, messages)

  const response = await sendMessageSync(reviewPrompt, [
    {
      role: 'user',
      content: 'Please review this conversation session.',
    },
  ])

  try {
    // Try to parse JSON from the response (handle possible markdown wrapping)
    let jsonStr = response.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    const parsed = JSON.parse(jsonStr)
    return {
      overallScore: clamp(parsed.overallScore ?? 50, 0, 100),
      fluency: clamp(parsed.fluency ?? 50, 0, 100),
      accuracy: clamp(parsed.accuracy ?? 50, 0, 100),
      registerAppropriateness: clamp(
        parsed.registerAppropriateness ?? 50,
        0,
        100
      ),
      vocabRange: clamp(parsed.vocabRange ?? 50, 0, 100),
      corrections: Array.isArray(parsed.corrections)
        ? parsed.corrections.slice(0, 5)
        : [],
      newVocab: Array.isArray(parsed.newVocab)
        ? parsed.newVocab.slice(0, 5)
        : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
    }
  } catch {
    // Return a fallback review if parsing fails
    return {
      overallScore: 50,
      fluency: 50,
      accuracy: 50,
      registerAppropriateness: 50,
      vocabRange: 50,
      corrections: [],
      newVocab: [],
      tips: [
        'Keep practicing! Try to use more complex sentence structures.',
      ],
    }
  }
}

// ─── Branch Detection ────────────────────────────────────────────────────────

/**
 * Simple heuristic branch detection based on conversation dynamics.
 * In production this could be AI-powered, but we keep it lightweight.
 */
function detectBranchPoint(
  userMessage: string,
  characterResponse: string,
  messageIndex: number
): BranchPoint | null {
  const lowerUser = userMessage.toLowerCase()
  const lowerResponse = characterResponse.toLowerCase()

  // Detect rudeness / negative tone
  const rudePatterns = [
    'no me importa',
    'cállate',
    'no quiero',
    'whatever',
    'shut up',
    'déjame',
    'no me molestes',
    'no thank',
  ]
  const rudeDetected = rudePatterns.some((p) => lowerUser.includes(p))

  // Detect hostility in response
  const hostilePatterns = [
    'grosero',
    'maleducado',
    'no me hables así',
    'ya no',
    'ofend',
    'respet',
  ]
  const hostileResponse = hostilePatterns.some((p) =>
    lowerResponse.includes(p)
  )

  if (rudeDetected || hostileResponse) {
    return {
      messageIndex,
      description: 'Tone shift — character became defensive or offended',
      consequence: 'negative',
    }
  }

  // Detect humor / charm
  const humorPatterns = ['jaja', 'haha', '😂', '😄', 'gracioso', 'chistos']
  const humorDetected = humorPatterns.some((p) => lowerResponse.includes(p))

  if (humorDetected) {
    return {
      messageIndex,
      description: 'Character warmed up — humor connected',
      consequence: 'positive',
    }
  }

  return null
}

// ─── XP Calculation ──────────────────────────────────────────────────────────

/**
 * Calculate XP earned from a conversation session.
 */
export function calculateConversationXP(session: ConversationSession): number {
  const userMessages = session.messages.filter((m) => m.role === 'user')
  const messageCount = userMessages.length
  const durationMinutes = session.duration / 60

  // Base XP: 15 per user message
  let xp = messageCount * 15

  // Duration bonus: 5 XP per minute, capped at 150
  xp += Math.min(Math.floor(durationMinutes * 5), 150)

  // Branch point bonuses
  const positiveBranches = session.branchPoints.filter(
    (b) => b.consequence === 'positive'
  ).length
  xp += positiveBranches * 25

  // Difficulty multiplier
  xp = Math.floor(xp * (1 + (session.scenario.difficultyLevel - 1) * 0.15))

  // Review score bonus (if available)
  if (session.review) {
    xp += Math.floor(session.review.overallScore * 0.5)
  }

  return Math.min(xp, 500) // Cap at 500 XP per session
}

// ─── Duration Goals ──────────────────────────────────────────────────────────

export const DURATION_GOALS = [5, 10, 30] as const // minutes

export function getDurationGoalReached(
  durationSeconds: number
): (typeof DURATION_GOALS)[number] | null {
  const minutes = durationSeconds / 60
  for (let i = DURATION_GOALS.length - 1; i >= 0; i--) {
    if (minutes >= DURATION_GOALS[i]) return DURATION_GOALS[i]
  }
  return null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
