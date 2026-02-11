import { sendMessageSync, Message } from './client'
import { buildFeynmanSystemPrompt } from './prompts'
import { Card } from '../../types'

export interface FeynmanDimensionScore {
  score: number
  feedback: string
}

export interface FeynmanGrade {
  accuracy: FeynmanDimensionScore
  simplicity: FeynmanDimensionScore
  completeness: FeynmanDimensionScore
  analogies: FeynmanDimensionScore
  overall: number
  gaps: string[]
  followUp: string
}

export interface FeynmanSession {
  id: string
  card: Card
  explanation: string
  grade: FeynmanGrade | null
  followUpAnswer: string | null
  followUpGrade: FeynmanGrade | null
  startedAt: Date
  completedAt: Date | null
}

export interface FeynmanHistoryEntry {
  cardId: string
  cardQuestion: string
  overall: number
  accuracy: number
  simplicity: number
  completeness: number
  analogies: number
  xpEarned: number
  timestamp: Date
}

export function startFeynmanSession(card: Card): FeynmanSession {
  return {
    id: `feynman-${Date.now()}`,
    card,
    explanation: '',
    grade: null,
    followUpAnswer: null,
    followUpGrade: null,
    startedAt: new Date(),
    completedAt: null,
  }
}

export async function gradeExplanation(
  card: Card,
  explanation: string
): Promise<FeynmanGrade> {
  const systemPrompt = buildFeynmanSystemPrompt(
    card.question,
    card.answer,
    card.ease
  )

  const messages: Message[] = [
    { role: 'user', content: explanation },
  ]

  const response = await sendMessageSync(systemPrompt, messages)
  return parseGradeResponse(response)
}

export async function gradeFollowUp(
  card: Card,
  originalExplanation: string,
  originalGrade: FeynmanGrade,
  followUpAnswer: string
): Promise<FeynmanGrade> {
  const systemPrompt = buildFeynmanSystemPrompt(
    card.question,
    card.answer,
    card.ease
  )

  const messages: Message[] = [
    { role: 'user', content: originalExplanation },
    {
      role: 'assistant',
      content: JSON.stringify({
        accuracy: originalGrade.accuracy,
        simplicity: originalGrade.simplicity,
        completeness: originalGrade.completeness,
        analogies: originalGrade.analogies,
        overall: originalGrade.overall,
        gaps: originalGrade.gaps,
        followUp: originalGrade.followUp,
      }),
    },
    { role: 'user', content: followUpAnswer },
  ]

  const response = await sendMessageSync(systemPrompt, messages)
  return parseGradeResponse(response)
}

function parseGradeResponse(response: string): FeynmanGrade {
  try {
    // Try to extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = response.trim()
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const parsed = JSON.parse(jsonStr)

    return {
      accuracy: parseDimension(parsed.accuracy),
      simplicity: parseDimension(parsed.simplicity),
      completeness: parseDimension(parsed.completeness),
      analogies: parseDimension(parsed.analogies),
      overall: clampScore(parsed.overall ?? 0),
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.filter((g: unknown) => typeof g === 'string') : [],
      followUp: typeof parsed.followUp === 'string' ? parsed.followUp : 'Can you explain this concept further?',
    }
  } catch {
    // Fallback if JSON parsing fails
    return {
      accuracy: { score: 50, feedback: 'Unable to parse detailed feedback.' },
      simplicity: { score: 50, feedback: 'Unable to parse detailed feedback.' },
      completeness: { score: 50, feedback: 'Unable to parse detailed feedback.' },
      analogies: { score: 50, feedback: 'Unable to parse detailed feedback.' },
      overall: 50,
      gaps: ['Could not analyze gaps — try explaining again.'],
      followUp: 'Can you try explaining this concept in a different way?',
    }
  }
}

function parseDimension(dim: unknown): FeynmanDimensionScore {
  if (dim && typeof dim === 'object' && 'score' in dim && 'feedback' in dim) {
    const d = dim as { score: unknown; feedback: unknown }
    return {
      score: clampScore(typeof d.score === 'number' ? d.score : 50),
      feedback: typeof d.feedback === 'string' ? d.feedback : '',
    }
  }
  return { score: 50, feedback: '' }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function calculateFeynmanXP(overall: number): number {
  if (overall >= 100) return 300
  if (overall >= 80) return 150
  return 50
}
