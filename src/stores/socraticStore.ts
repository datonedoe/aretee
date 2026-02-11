import { create } from 'zustand'
import { Card } from '../types'
import {
  SocraticSession,
  SocraticMessage,
  startSocraticDialogue,
  sendSocraticReply,
  cleanInsightMarker,
  hasMinimumExchanges,
} from '../services/ai'
import { useProfileStore } from './profileStore'
import { getLevelForXP } from '../services/gamification'
import { playSound } from '../services/audio/sounds'

interface SocraticState {
  session: SocraticSession | null
  isStreaming: boolean
  streamingText: string
  error: string | null
  insightJustReached: boolean
  xpAwarded: number

  // Session history (persisted per-app session, not across restarts)
  sessionHistory: {
    cardId: string
    insightReached: boolean
    exchanges: number
    xp: number
  }[]

  startSession: (card: Card) => void
  sendReply: (message: string) => Promise<void>
  endSession: () => void
  clearInsightFlag: () => void
}

const SOCRATIC_XP = 100 // XP for a 5+ exchange session or insight

function awardSocraticXP(
  isInsight: boolean,
  get: () => SocraticState,
  set: (
    partial:
      | Partial<SocraticState>
      | ((state: SocraticState) => Partial<SocraticState>)
  ) => void
): void {
  const { session, xpAwarded } = get()
  if (!session || xpAwarded > 0) return

  const xp = SOCRATIC_XP
  const profileStore = useProfileStore.getState()

  // Add XP to profile
  const newTotalXP = profileStore.profile.totalXP + xp
  const newLevel = getLevelForXP(newTotalXP)

  profileStore.profile.totalXP = newTotalXP
  profileStore.profile.level = newLevel.level
  profileStore.profile.xpHistory = [
    ...profileStore.profile.xpHistory.slice(-99),
    {
      action: isInsight
        ? 'Socratic insight'
        : 'Socratic session (5+ exchanges)',
      xp,
      timestamp: new Date(),
    },
  ]

  // Update quest progress
  profileStore.updateQuestProgress('socratic_1', 1)

  // Save
  profileStore.saveProfile()

  set({ xpAwarded: xp })

  if (isInsight) {
    playSound('xp')
  }
}

export const useSocraticStore = create<SocraticState>((set, get) => ({
  session: null,
  isStreaming: false,
  streamingText: '',
  error: null,
  insightJustReached: false,
  xpAwarded: 0,
  sessionHistory: [],

  startSession: (card: Card) => {
    const { session: newSession } = startSocraticDialogue(card)
    set({
      session: newSession,
      isStreaming: false,
      streamingText: '',
      error: null,
      insightJustReached: false,
      xpAwarded: 0,
    })
  },

  sendReply: async (message: string) => {
    const { session } = get()
    if (!session || get().isStreaming) return

    // Add user message immediately
    const userMsg: SocraticMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    }

    set((s) => ({
      session: s.session
        ? { ...s.session, messages: [...s.session.messages, userMsg] }
        : null,
      isStreaming: true,
      streamingText: '',
      error: null,
    }))

    const currentSession = get().session
    if (!currentSession) return

    try {
      await sendSocraticReply(currentSession, message, {
        onToken: (token) => {
          set((s) => ({ streamingText: s.streamingText + token }))
        },
        onComplete: (fullText) => {
          const isInsight = fullText.includes('[INSIGHT]')
          const displayText = cleanInsightMarker(fullText)
          const assistantMsg: SocraticMessage = {
            role: 'assistant',
            content: displayText,
            timestamp: new Date(),
            isInsight,
          }

          set((s) => {
            const sess = s.session
            if (!sess) return s

            const updated: SocraticSession = {
              ...sess,
              messages: [...sess.messages, assistantMsg],
              exchangeCount: sess.exchangeCount + 1,
              insightReached: isInsight || sess.insightReached,
            }

            return {
              session: updated,
              isStreaming: false,
              streamingText: '',
              insightJustReached: isInsight,
            }
          })

          // Award XP when insight reached
          if (isInsight) {
            awardSocraticXP(true, get, set)
            playSound('insight')
          }
        },
        onError: (err) => {
          set({
            isStreaming: false,
            streamingText: '',
            error: err.message,
          })
        },
      })
    } catch (err) {
      set({
        isStreaming: false,
        streamingText: '',
        error: err instanceof Error ? err.message : 'Failed to send message',
      })
    }
  },

  endSession: () => {
    const { session, xpAwarded } = get()
    if (!session) return

    // Award XP if 5+ exchanges and not yet awarded
    if (hasMinimumExchanges(session) && xpAwarded === 0) {
      awardSocraticXP(false, get, set)
    }

    const finalXP = get().xpAwarded

    // Record in history
    set((s) => ({
      session: null,
      isStreaming: false,
      streamingText: '',
      error: null,
      insightJustReached: false,
      sessionHistory: [
        ...s.sessionHistory,
        {
          cardId: session.card.id,
          insightReached: session.insightReached,
          exchanges: session.exchangeCount,
          xp: finalXP,
        },
      ],
    }))
  },

  clearInsightFlag: () => {
    set({ insightJustReached: false })
  },
}))
