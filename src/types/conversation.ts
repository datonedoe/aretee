/**
 * Sprint 12: Deep Conversation Scenarios
 * Types for AI characters with personality, memory, and branching dialogue.
 */

export type RegisterLevel = 'formal' | 'informal' | 'street' | 'professional'

export interface Character {
  id: string
  name: string
  emoji: string
  personality: string
  speechPatterns: string[]
  defaultRegister: 'formal' | 'informal' | 'street'
  backstory: string
  avatarEmoji: string
}

export interface Scenario {
  id: string
  title: string
  description: string
  settingEmoji: string
  characters: Character[]
  openingLine: string
  difficultyLevel: 1 | 2 | 3 | 4 | 5
  targetRegister: RegisterLevel
  tags: string[]
  estimatedMinutes: number
}

export interface ConversationMessage {
  role: 'user' | 'character'
  content: string
  timestamp: Date
  characterId?: string
  registerUsed?: RegisterLevel
  corrections?: string[]
}

export interface BranchPoint {
  messageIndex: number
  description: string
  consequence: 'positive' | 'negative' | 'neutral'
}

export interface ConversationCorrection {
  original: string
  corrected: string
  explanation: string
}

export interface ConversationReview {
  overallScore: number
  fluency: number
  accuracy: number
  registerAppropriateness: number
  vocabRange: number
  corrections: ConversationCorrection[]
  newVocab: string[]
  tips: string[]
}

export interface ConversationSession {
  id: string
  scenario: Scenario
  activeCharacter: Character
  messages: ConversationMessage[]
  startedAt: Date
  endedAt?: Date
  duration: number
  branchPoints: BranchPoint[]
  review: ConversationReview | null
  xpEarned: number
}

export interface ConversationHistoryEntry {
  sessionId: string
  scenarioId: string
  scenarioTitle: string
  characterName: string
  overallScore: number | null
  duration: number
  xpEarned: number
  timestamp: Date
}
