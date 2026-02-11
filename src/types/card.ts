import { SyncStatus } from './enums'
import { v4 as uuidv4 } from 'uuid'

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
}

export interface ParsedCard {
  question: string
  answer: string
  lineStart: number
  lineEnd: number
  nextReviewDate: Date | null
  interval: number | null
  ease: number | null
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
  }
}
