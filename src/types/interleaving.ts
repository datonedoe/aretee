import { Card, Deck, CardState } from './card'
import { ErrorCategory } from './errors'

/** A segment within a blended session */
export enum SessionSegmentMode {
  Flash = 'flash',
  Socratic = 'socratic',
  Feynman = 'feynman',
}

export interface SessionSegment {
  card: Card
  mode: SessionSegmentMode
  reason: string // Why this mode was chosen for this card
}

/** Configuration for interleaved session generation */
export interface InterleavingConfig {
  /** Max cards per session */
  sessionSize: number
  /** Fraction of cards from weak error patterns (0-1) */
  weaknessFocus: number
  /** Whether to mix decks within a session */
  crossDeckMixing: boolean
  /** Min difficulty variation between consecutive cards */
  difficultySpread: number
  /** Modes to include */
  enabledModes: SessionSegmentMode[]
}

export const DEFAULT_INTERLEAVING_CONFIG: InterleavingConfig = {
  sessionSize: 15,
  weaknessFocus: 0.3,
  crossDeckMixing: true,
  difficultySpread: 0.15,
  enabledModes: [
    SessionSegmentMode.Flash,
    SessionSegmentMode.Socratic,
    SessionSegmentMode.Feynman,
  ],
}

/** A micro-challenge pushed via notification */
export enum MicroChallengeType {
  QuickRecall = 'quick_recall',
  FillTheGap = 'fill_the_gap',
  ListeningSnap = 'listening_snap',
  PictureDescribe = 'picture_describe',
  CulturalMicro = 'cultural_micro',
}

export interface MicroChallenge {
  id: string
  type: MicroChallengeType
  card: Card
  prompt: string
  expectedAnswer: string
  timeLimit: number // seconds
  scheduledFor: Date
}

/** Quiet hours configuration */
export interface QuietHoursConfig {
  enabled: boolean
  startHour: number // 0-23
  endHour: number   // 0-23
}

export const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  enabled: true,
  startHour: 22,
  endHour: 8,
}
