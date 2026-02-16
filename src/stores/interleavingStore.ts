import { create } from 'zustand'
import { Card, Deck } from '../types'
import { ErrorPattern } from '../types/errors'
import {
  SessionSegment,
  InterleavingConfig,
  MicroChallenge,
  QuietHoursConfig,
  DEFAULT_INTERLEAVING_CONFIG,
} from '../types/interleaving'
import { SessionComposer } from '../services/interleaving/composer'
import { MicroChallengeScheduler } from '../services/interleaving/micro'

const composer = new SessionComposer()
const microScheduler = new MicroChallengeScheduler()

interface InterleavingState {
  // Blended session
  segments: SessionSegment[]
  currentSegmentIndex: number
  isSessionActive: boolean

  // Micro-challenges
  challenges: MicroChallenge[]
  pendingChallenges: MicroChallenge[]

  // Config
  config: InterleavingConfig
  quietHours: QuietHoursConfig | null

  // Actions — Session
  composeSession: (decks: Deck[], errorPatterns: ErrorPattern[]) => void
  startSession: () => void
  advanceSegment: () => void
  getCurrentSegment: () => SessionSegment | null
  getProgress: () => { current: number; total: number }
  endSession: () => void
  updateConfig: (partial: Partial<InterleavingConfig>) => void

  // Actions — Micro-challenges
  loadMicroSchedule: () => Promise<void>
  generateChallenges: (decks: Deck[], hoursAhead?: number) => void
  completeMicroChallenge: (id: string) => Promise<void>
  setQuietHours: (config: QuietHoursConfig) => Promise<void>
}

export const useInterleavingStore = create<InterleavingState>((set, get) => ({
  segments: [],
  currentSegmentIndex: 0,
  isSessionActive: false,
  challenges: [],
  pendingChallenges: [],
  config: DEFAULT_INTERLEAVING_CONFIG,
  quietHours: null,

  composeSession: (decks: Deck[], errorPatterns: ErrorPattern[]) => {
    const { config } = get()
    const segments = composer.compose(decks, errorPatterns, config)
    set({ segments, currentSegmentIndex: 0, isSessionActive: false })
  },

  startSession: () => {
    set({ isSessionActive: true, currentSegmentIndex: 0 })
  },

  advanceSegment: () => {
    const { currentSegmentIndex, segments } = get()
    const next = currentSegmentIndex + 1
    if (next >= segments.length) {
      set({ isSessionActive: false })
    } else {
      set({ currentSegmentIndex: next })
    }
  },

  getCurrentSegment: () => {
    const { segments, currentSegmentIndex, isSessionActive } = get()
    if (!isSessionActive || currentSegmentIndex >= segments.length) return null
    return segments[currentSegmentIndex]
  },

  getProgress: () => {
    const { currentSegmentIndex, segments } = get()
    return { current: currentSegmentIndex, total: segments.length }
  },

  endSession: () => {
    set({ isSessionActive: false, segments: [], currentSegmentIndex: 0 })
  },

  updateConfig: (partial: Partial<InterleavingConfig>) => {
    const { config } = get()
    set({ config: { ...config, ...partial } })
  },

  loadMicroSchedule: async () => {
    await microScheduler.load()
    const pending = microScheduler.getPending()
    set({ pendingChallenges: pending, quietHours: microScheduler.getQuietHours() })
  },

  generateChallenges: (decks: Deck[], hoursAhead: number = 8) => {
    const challenges = microScheduler.generateChallenges(decks, hoursAhead)
    const pending = microScheduler.getPending()
    set({ challenges, pendingChallenges: pending })
  },

  completeMicroChallenge: async (id: string) => {
    await microScheduler.complete(id)
    const pending = microScheduler.getPending()
    set({ pendingChallenges: pending })
  },

  setQuietHours: async (config: QuietHoursConfig) => {
    await microScheduler.setQuietHours(config)
    set({ quietHours: config })
  },
}))
