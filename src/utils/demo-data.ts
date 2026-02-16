/**
 * Demo data for screenshots and testing.
 * Activated via URL param ?demo=true on web.
 */
import { Card, Deck, CardState } from '../types'
import { ErrorEvent, ErrorCategory } from '../types/errors'
import { SyncStatus } from '../types/enums'

const now = new Date()
const h = (ms: number) => new Date(now.getTime() - ms)

function mkCard(
  id: string,
  question: string,
  answer: string,
  deckId: string,
  opts: Partial<Card> = {}
): Card {
  return {
    id,
    question,
    answer,
    deckId,
    sourceFilePath: `/demo/${id}.md`,
    lineStart: 1,
    lineEnd: 3,
    nextReviewDate: h(3600000),
    interval: 4,
    ease: 250,
    reviewCount: 3,
    syncStatus: SyncStatus.Synced,
    lastModified: now,
    difficulty: 3,
    stability: 4,
    retrievability: 0.9,
    elapsed_days: 1,
    scheduled_days: 4,
    last_review: h(86400000),
    reps: 3,
    lapses: 0,
    state: CardState.Review,
    responseTimeMs: 2500,
    ...opts,
  }
}

export function getDemoDecks(): Deck[] {
  return [
    {
      id: 'deck-es',
      name: 'Spanish Vocab',
      folderPath: '/demo/spanish',
      lastScanned: now,
      cards: [
        mkCard('c1', '¿Cómo estás?', 'How are you?', 'deck-es'),
        mkCard('c2', 'La madrugada', 'The early morning / dawn', 'deck-es', {
          difficulty: 5,
          stability: 2,
          lapses: 2,
        }),
        mkCard('c3', 'Echar de menos', 'To miss (someone)', 'deck-es', {
          reps: 0,
          state: CardState.New,
        }),
        mkCard('c4', 'Aprovechar', 'To take advantage of / make the most of', 'deck-es', {
          nextReviewDate: new Date(now.getTime() + 86400000),
          state: CardState.Review,
          reps: 8,
          stability: 15,
        }),
        mkCard('c5', 'Embarazada', 'Pregnant (NOT embarrassed — false friend!)', 'deck-es', {
          lapses: 3,
          difficulty: 6,
        }),
      ],
    },
    {
      id: 'deck-zh',
      name: 'Mandarin Basics',
      folderPath: '/demo/mandarin',
      lastScanned: now,
      cards: [
        mkCard('c6', '你好 (nǐ hǎo)', 'Hello', 'deck-zh', { reps: 5, stability: 8 }),
        mkCard('c7', '谢谢 (xiè xiè)', 'Thank you', 'deck-zh', {
          nextReviewDate: new Date(now.getTime() + 86400000),
          state: CardState.Review,
          reps: 7,
          stability: 12,
        }),
        mkCard('c8', '对不起 (duìbùqǐ)', 'Sorry / Excuse me', 'deck-zh', {
          reps: 0,
          state: CardState.New,
        }),
      ],
    },
    {
      id: 'deck-quant',
      name: 'Quant Finance',
      folderPath: '/demo/quant',
      lastScanned: now,
      cards: [
        mkCard(
          'c9',
          'Black-Scholes equation?',
          '∂V/∂t + ½σ²S²∂²V/∂S² + rS∂V/∂S - rV = 0',
          'deck-quant',
          { difficulty: 8, stability: 1.5, lapses: 3 }
        ),
        mkCard(
          'c10',
          'Implied volatility?',
          "Market's forecast of likely price movement — the vol that makes model price = market price",
          'deck-quant',
          { reps: 0, state: CardState.New }
        ),
        mkCard(
          'c11',
          'What is delta in options?',
          'Rate of change of option price with respect to underlying price (∂V/∂S)',
          'deck-quant',
          { difficulty: 4, stability: 3 }
        ),
      ],
    },
  ]
}

export function getDemoErrorEvents(): ErrorEvent[] {
  return [
    {
      id: 'e1',
      cardId: 'c2',
      deckId: 'deck-es',
      category: ErrorCategory.L1Interference,
      subcategory: 'ser_estar',
      timestamp: h(86400000 * 3),
      responseTimeMs: 8000,
      confidence: 0.7,
      context: 'ser vs estar',
      correction: 'Use estar for temporary states',
    },
    {
      id: 'e2',
      cardId: 'c2',
      deckId: 'deck-es',
      category: ErrorCategory.L1Interference,
      subcategory: 'ser_estar',
      timestamp: h(86400000 * 1),
      responseTimeMs: 9000,
      confidence: 0.7,
    },
    {
      id: 'e3',
      cardId: 'c5',
      deckId: 'deck-es',
      category: ErrorCategory.FalseFriend,
      timestamp: h(86400000 * 5),
      responseTimeMs: 5000,
      confidence: 0.65,
      context: 'embarazada',
      correction: 'pregnant, not embarrassed',
    },
    {
      id: 'e4',
      cardId: 'c5',
      deckId: 'deck-es',
      category: ErrorCategory.FalseFriend,
      timestamp: h(86400000 * 2),
      responseTimeMs: 4000,
      confidence: 0.65,
    },
    {
      id: 'e5',
      cardId: 'c9',
      deckId: 'deck-quant',
      category: ErrorCategory.ConceptualGap,
      timestamp: h(86400000 * 4),
      responseTimeMs: 2000,
      confidence: 0.75,
      context: 'Black-Scholes',
    },
    {
      id: 'e6',
      cardId: 'c9',
      deckId: 'deck-quant',
      category: ErrorCategory.ConceptualGap,
      timestamp: h(86400000 * 1),
      responseTimeMs: 1800,
      confidence: 0.7,
    },
    {
      id: 'e7',
      cardId: 'c1',
      deckId: 'deck-es',
      category: ErrorCategory.PlainForgetting,
      timestamp: h(86400000 * 6),
      responseTimeMs: 12000,
      confidence: 0.8,
    },
    {
      id: 'e8',
      cardId: 'c6',
      deckId: 'deck-zh',
      category: ErrorCategory.PartialRecall,
      timestamp: h(86400000 * 2),
      responseTimeMs: 16000,
      confidence: 0.8,
    },
  ]
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('demo')
}
