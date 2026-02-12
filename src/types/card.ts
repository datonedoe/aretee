import { SyncStatus } from './enums'
import { v4 as uuidv4 } from 'uuid'

/** FSRS card state */
export enum CardState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface Card {
  id: string
  question: string
  answer: string
  sourceFilePath: string
  lineStart: number
  lineEnd: number
  nextReviewDate: Date
  interval: number
  ease: number
  reviewCount: number
  syncStatus: SyncStatus
  lastModified: Date
  deckId: string
  // FSRS fields
  difficulty: number
  stability: number
  retrievability: number
  elapsed_days: number
  scheduled_days: number
  last_review: Date | null
  reps: number
  lapses: number
  state: CardState
  responseTimeMs: number | null
}

export interface ParsedCard {
  question: string
  answer: string
  lineStart: number
  lineEnd: number
  nextReviewDate: Date | null
  interval: number | null
  ease: number | null
  // FSRS parsed fields
  difficulty: number | null
  stability: number | null
  isBidirectional: boolean
}

export interface Deck {
  id: string
  name: string
  folderPath: string
  lastScanned: Date
  cards: Card[]
}

export interface ReviewResult {
  nextReviewDate: Date
  newInterval: number
  newEase: number
  // FSRS results
  newDifficulty: number
  newStability: number
  retrievability: number
  elapsed_days: number
  scheduled_days: number
  state: CardState
  lapses: number
}

export function isCardDue(card: Card): boolean {
  return new Date(card.nextReviewDate) <= new Date()
}

export function createCard(
  parsed: ParsedCard,
  sourceFilePath: string,
  deckId: string
): Card {
  const now = new Date()
  return {
    id: uuidv4(),
    question: parsed.question,
    answer: parsed.answer,
    sourceFilePath,
    lineStart: parsed.lineStart,
    lineEnd: parsed.lineEnd,
    nextReviewDate: parsed.nextReviewDate ?? now,
    interval: parsed.interval ?? 0,
    ease: parsed.ease ?? 250,
    reviewCount: 0,
    syncStatus: SyncStatus.Synced,
    lastModified: now,
    deckId,
    difficulty: parsed.difficulty ?? 0,
    stability: parsed.stability ?? 0,
    retrievability: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    last_review: null,
    reps: 0,
    lapses: 0,
    state: CardState.New,
    responseTimeMs: null,
  }
}
