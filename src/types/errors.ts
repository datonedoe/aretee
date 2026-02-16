export enum ErrorCategory {
  L1Interference = 'l1_interference',
  FalseFriend = 'false_friend',
  Overgeneralization = 'overgeneralization',
  RegisterMismatch = 'register_mismatch',
  Avoidance = 'avoidance',
  PlainForgetting = 'plain_forgetting',
  ConceptualGap = 'conceptual_gap',
  PartialRecall = 'partial_recall',
}

export interface ErrorEvent {
  id: string
  cardId: string
  deckId: string
  category: ErrorCategory
  subcategory?: string
  timestamp: Date
  responseTimeMs: number | null
  context?: string
  correction?: string
  confidence: number
}

export interface ErrorPattern {
  category: ErrorCategory
  subcategory?: string
  count: number
  firstSeen: Date
  lastSeen: Date
  trend: 'improving' | 'stable' | 'worsening'
  relatedCardIds: string[]
  reductionRate: number
}

export interface UserErrorProfile {
  userId: string
  patterns: ErrorPattern[]
  topWeaknesses: ErrorCategory[]
  lastUpdated: Date
  totalErrors: number
  totalReviews: number
  errorRate: number
}
