/**
 * Sprint 12: Deep Conversation Scenarios
 * Zustand store for conversation state management.
 */

import { create } from 'zustand'
import {
  Character,
  Scenario,
  ConversationMessage,
  ConversationSession,
  ConversationReview,
  ConversationHistoryEntry,
  BranchPoint,
} from '../types/conversation'
import {
  startConversation,
  sendConversationMessage,
  generateConversationReview,
  calculateConversationXP,
  getDurationGoalReached,
} from '../services/ai/conversation'
import { useProfileStore } from './profileStore'
import { getLevelForXP } from '../services/gamification'
import { playSound } from '../services/audio/sounds'

interface ConversationState {
  // Active session
  session: ConversationSession | null
  isStreaming: boolean
  streamingText: string
  error: string | null
  isGeneratingReview: boolean

  // Review state
  review: ConversationReview | null

  // Duration tracking
  durationGoalReached: number | null // 5, 10, or 30 minutes

  // Session history
  history: ConversationHistoryEntry[]

  // Actions
  start: (scenario: Scenario, character: Character) => void
  sendMessage: (text: string) => Promise<void>
  endSession: () => Promise<void>
  requestReview: () => Promise<void>
  clearSession: () => void
}

const CONVERSATION_XP_BASE = 50

function awardXP(amount: number): void {
  const profileStore = useProfileStore.getState()
  const newTotalXP = profileStore.profile.totalXP + amount
  const newLevel = getLevelForXP(newTotalXP)

  profileStore.profile.totalXP = newTotalXP
  profileStore.profile.level = newLevel.level
  profileStore.profile.xpHistory = [
    ...profileStore.profile.xpHistory.slice(-99),
    {
      action: 'Conversation practice',
      xp: amount,
      timestamp: new Date(),
    },
  ]

  profileStore.updateQuestProgress('conversation_1', 1)
  profileStore.saveProfile()
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  session: null,
  isStreaming: false,
  streamingText: '',
  error: null,
  isGeneratingReview: false,
  review: null,
  durationGoalReached: null,
  history: [],

  start: (scenario: Scenario, character: Character) => {
    const session = startConversation(scenario, character)
    set({
      session,
      isStreaming: false,
      streamingText: '',
      error: null,
      review: null,
      isGeneratingReview: false,
      durationGoalReached: null,
    })
  },

  sendMessage: async (text: string) => {
    const { session } = get()
    if (!session || get().isStreaming) return

    // Add user message immediately for instant UI feedback
    const userMsg: ConversationMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    set((s) => ({
      session: s.session
        ? {
            ...s.session,
            messages: [...s.session.messages, userMsg],
          }
        : null,
      isStreaming: true,
      streamingText: '',
      error: null,
    }))

    const currentSession = get().session
    if (!currentSession) return

    try {
      // Determine user level from scenario difficulty
      const userLevel = currentSession.scenario.difficultyLevel

      const { updatedSession, branchDetected } =
        await sendConversationMessage(
          currentSession,
          text,
          userLevel,
          {
            onToken: (token) => {
              set((s) => ({
                streamingText: s.streamingText + token,
              }))
            },
            onComplete: (fullText) => {
              const characterMsg: ConversationMessage = {
                role: 'character',
                content: fullText,
                timestamp: new Date(),
                characterId: currentSession.activeCharacter.id,
              }

              set((s) => {
                const sess = s.session
                if (!sess) return s

                const now = new Date()
                const duration = Math.floor(
                  (now.getTime() - sess.startedAt.getTime()) / 1000
                )

                // Check duration goals
                const goalReached = getDurationGoalReached(duration)
                const isNewGoal =
                  goalReached !== null &&
                  goalReached !== s.durationGoalReached

                const updatedMessages = [
                  ...sess.messages,
                  characterMsg,
                ]

                const newBranchPoints = branchDetected
                  ? [...sess.branchPoints, branchDetected]
                  : sess.branchPoints

                return {
                  session: {
                    ...sess,
                    messages: updatedMessages,
                    duration,
                    branchPoints: newBranchPoints,
                  },
                  isStreaming: false,
                  streamingText: '',
                  durationGoalReached: isNewGoal
                    ? goalReached
                    : s.durationGoalReached,
                }
              })
            },
            onError: (err) => {
              set({
                isStreaming: false,
                streamingText: '',
                error: err.message,
              })
            },
          }
        )
    } catch (err) {
      set({
        isStreaming: false,
        streamingText: '',
        error:
          err instanceof Error ? err.message : 'Failed to send message',
      })
    }
  },

  requestReview: async () => {
    const { session } = get()
    if (!session || session.messages.length < 3) return

    set({ isGeneratingReview: true, error: null })

    try {
      const review = await generateConversationReview(session)
      const xp = calculateConversationXP({
        ...session,
        review,
      })

      set((s) => ({
        review,
        isGeneratingReview: false,
        session: s.session
          ? { ...s.session, review, xpEarned: xp }
          : null,
      }))

      // Award XP
      awardXP(xp)
      playSound('feynman') // reuse the "knowledge solidified" sound
    } catch (err) {
      set({
        isGeneratingReview: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to generate review',
      })
    }
  },

  endSession: async () => {
    const { session, review } = get()
    if (!session) return

    // If no review yet and enough messages, generate one
    if (!review && session.messages.filter((m) => m.role === 'user').length >= 2) {
      await get().requestReview()
    }

    const finalSession = get().session
    if (!finalSession) return

    const xp = finalSession.xpEarned || calculateConversationXP(finalSession)

    // Award XP if not yet awarded during review
    if (!finalSession.review) {
      awardXP(xp)
    }

    // Record in history
    const entry: ConversationHistoryEntry = {
      sessionId: finalSession.id,
      scenarioId: finalSession.scenario.id,
      scenarioTitle: finalSession.scenario.title,
      characterName: finalSession.activeCharacter.name,
      overallScore: finalSession.review?.overallScore ?? null,
      duration: finalSession.duration,
      xpEarned: xp,
      timestamp: new Date(),
    }

    set((s) => ({
      history: [...s.history, entry],
    }))
  },

  clearSession: () => {
    set({
      session: null,
      isStreaming: false,
      streamingText: '',
      error: null,
      review: null,
      isGeneratingReview: false,
      durationGoalReached: null,
    })
  },
}))
