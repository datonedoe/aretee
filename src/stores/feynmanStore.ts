import { create } from 'zustand'
import { Card } from '../types'
import {
  FeynmanSession,
  FeynmanGrade,
  FeynmanHistoryEntry,
  startFeynmanSession,
  gradeExplanation,
  gradeFollowUp,
  calculateFeynmanXP,
} from '../services/ai/feynman'
import { useProfileStore } from './profileStore'
import { getLevelForXP } from '../services/gamification'
import { playSound } from '../services/audio/sounds'

type FeynmanPhase = 'explain' | 'grading' | 'results' | 'followUp' | 'followUpGrading' | 'followUpResults'

interface FeynmanState {
  session: FeynmanSession | null
  phase: FeynmanPhase
  isGrading: boolean
  error: string | null
  xpAwarded: number

  // Score history (persisted per-app session)
  scoreHistory: FeynmanHistoryEntry[]

  startSession: (card: Card) => void
  submitExplanation: (explanation: string) => Promise<void>
  submitFollowUp: (answer: string) => Promise<void>
  goToFollowUp: () => void
  endSession: () => void
}

const FEYNMAN_BASE_XP = 50 // Base XP for any Feynman attempt

function awardFeynmanXP(
  overall: number,
  get: () => FeynmanState,
  set: (
    partial:
      | Partial<FeynmanState>
      | ((state: FeynmanState) => Partial<FeynmanState>)
  ) => void
): number {
  const { xpAwarded } = get()
  if (xpAwarded > 0) return 0

  const xp = calculateFeynmanXP(overall)
  const profileStore = useProfileStore.getState()

  const newTotalXP = profileStore.profile.totalXP + xp
  const newLevel = getLevelForXP(newTotalXP)

  profileStore.profile.totalXP = newTotalXP
  profileStore.profile.level = newLevel.level
  profileStore.profile.xpHistory = [
    ...profileStore.profile.xpHistory.slice(-99),
    {
      action: `Feynman explanation (${overall}%)`,
      xp,
      timestamp: new Date(),
    },
  ]

  // Update quest progress
  profileStore.updateQuestProgress('feynman_1', 1)

  profileStore.saveProfile()

  set({ xpAwarded: xp })

  // Play appropriate sound
  if (overall >= 80) {
    playSound('feynman')
  } else {
    playSound('xp')
  }

  return xp
}

export const useFeynmanStore = create<FeynmanState>((set, get) => ({
  session: null,
  phase: 'explain',
  isGrading: false,
  error: null,
  xpAwarded: 0,
  scoreHistory: [],

  startSession: (card: Card) => {
    const session = startFeynmanSession(card)
    set({
      session,
      phase: 'explain',
      isGrading: false,
      error: null,
      xpAwarded: 0,
    })
  },

  submitExplanation: async (explanation: string) => {
    const { session } = get()
    if (!session || get().isGrading) return

    set({
      phase: 'grading',
      isGrading: true,
      error: null,
      session: { ...session, explanation },
    })

    try {
      const grade = await gradeExplanation(session.card, explanation)

      set((s) => ({
        session: s.session ? { ...s.session, grade } : null,
        phase: 'results',
        isGrading: false,
      }))

      // Award XP
      awardFeynmanXP(grade.overall, get, set)
    } catch (err) {
      set({
        isGrading: false,
        phase: 'explain',
        error: err instanceof Error ? err.message : 'Failed to grade explanation',
      })
    }
  },

  goToFollowUp: () => {
    set({ phase: 'followUp' })
  },

  submitFollowUp: async (answer: string) => {
    const { session } = get()
    if (!session || !session.grade || get().isGrading) return

    set({
      phase: 'followUpGrading',
      isGrading: true,
      error: null,
      session: { ...session, followUpAnswer: answer },
    })

    try {
      const followUpGrade = await gradeFollowUp(
        session.card,
        session.explanation,
        session.grade,
        answer
      )

      set((s) => ({
        session: s.session ? { ...s.session, followUpGrade } : null,
        phase: 'followUpResults',
        isGrading: false,
      }))
    } catch (err) {
      set({
        isGrading: false,
        phase: 'followUp',
        error: err instanceof Error ? err.message : 'Failed to grade follow-up',
      })
    }
  },

  endSession: () => {
    const { session, xpAwarded } = get()
    if (!session) return

    const grade = session.followUpGrade ?? session.grade

    // Record in history if graded
    if (grade) {
      const entry: FeynmanHistoryEntry = {
        cardId: session.card.id,
        cardQuestion: session.card.question,
        overall: grade.overall,
        accuracy: grade.accuracy.score,
        simplicity: grade.simplicity.score,
        completeness: grade.completeness.score,
        analogies: grade.analogies.score,
        xpEarned: xpAwarded,
        timestamp: new Date(),
      }

      set((s) => ({
        session: null,
        phase: 'explain',
        isGrading: false,
        error: null,
        xpAwarded: 0,
        scoreHistory: [...s.scoreHistory, entry],
      }))
    } else {
      set({
        session: null,
        phase: 'explain',
        isGrading: false,
        error: null,
        xpAwarded: 0,
      })
    }
  },
}))
