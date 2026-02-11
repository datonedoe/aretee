import { create } from 'zustand'
import {
  ProfileData,
  DEFAULT_PROFILE_DATA,
  UnlockedAchievement,
  XPEvent,
  DailyQuests,
  AchievementDefinition,
  ReviewResponse,
} from '../types'
import { StreakData, DEFAULT_STREAK_DATA } from '../types'
import { getStorageService } from '../services/platform'
import {
  calculateReviewXP,
  calculateDeckCompleteXP,
  calculateStreakXP,
  calculateComebackXP,
  getLevelForXP,
  getLevelProgress,
  StreakService,
  checkAchievements,
  generateDailyQuests,
  getQuestDefinition,
  XP_RULES,
} from '../services/gamification'
import type { AchievementContext } from '../services/gamification'

const PROFILE_STORAGE_KEY = 'profileData'

interface GamificationEvent {
  xpGained: number
  leveledUp: boolean
  newLevel: number | null
  newAchievements: AchievementDefinition[]
  questsCompleted: string[]
  streakXP: number
}

interface ProfileState {
  profile: ProfileData
  streakData: StreakData
  isLoaded: boolean
  pendingEvents: GamificationEvent[]

  // Session tracking (resets each session)
  sessionXP: number
  sessionEasyStreak: number
  sessionDecksReviewed: Set<string>
  sessionAgainCount: number

  loadProfile: () => Promise<void>
  saveProfile: () => Promise<void>

  // Called by reviewStore on each card answer
  onCardReviewed: (response: ReviewResponse, deckId: string) => Promise<GamificationEvent>

  // Called when a full deck review completes
  onDeckCompleted: () => Promise<number>

  // Called when a review session ends
  onSessionEnd: (cardsReviewed: number, durationSeconds: number, accuracy: number, deckCount: number) => Promise<GamificationEvent>

  // Quest management
  ensureDailyQuests: () => void
  updateQuestProgress: (questId: string, increment: number) => void

  // Session reset
  resetSessionTracking: () => void

  // Consume pending events (for UI)
  consumeEvents: () => GamificationEvent[]
}

const streakService = new StreakService()

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: { ...DEFAULT_PROFILE_DATA },
  streakData: { ...DEFAULT_STREAK_DATA },
  isLoaded: false,
  pendingEvents: [],
  sessionXP: 0,
  sessionEasyStreak: 0,
  sessionDecksReviewed: new Set(),
  sessionAgainCount: 0,

  loadProfile: async () => {
    const storage = getStorageService()
    const saved = await storage.get<ProfileData>(PROFILE_STORAGE_KEY)
    const streakData = await streakService.loadStreak()

    set({
      profile: saved ?? { ...DEFAULT_PROFILE_DATA },
      streakData,
      isLoaded: true,
    })

    // Ensure daily quests exist for today
    get().ensureDailyQuests()
  },

  saveProfile: async () => {
    const storage = getStorageService()
    const { profile } = get()
    await storage.set(PROFILE_STORAGE_KEY, profile)
  },

  onCardReviewed: async (response, deckId) => {
    const state = get()
    const { profile, streakData: oldStreakData } = state

    // Calculate XP
    let xpGained = calculateReviewXP(response)

    // Track easy streak
    let newEasyStreak = state.sessionEasyStreak
    if (response === ReviewResponse.Easy) {
      newEasyStreak++
    } else {
      newEasyStreak = 0
    }

    // Track again count
    let newAgainCount = state.sessionAgainCount
    if (response === ReviewResponse.Again) {
      newAgainCount++
    }

    // Check for comeback bonus (only on first card of session)
    let isComeback = false
    if (state.sessionXP === 0 && streakService.isComeback(oldStreakData)) {
      xpGained += calculateComebackXP()
      isComeback = true
    }

    // Update streak
    const newStreakData = await streakService.recordReview(response)

    // Streak XP — only award once per day (when streak increments from previous)
    let streakXP = 0
    if (
      newStreakData.summary.currentStreak > oldStreakData.summary.currentStreak &&
      newStreakData.summary.currentStreak > 0
    ) {
      streakXP = calculateStreakXP(newStreakData.summary.currentStreak)
      xpGained += streakXP
    }

    // Update totals
    const newTotalXP = profile.totalXP + xpGained
    const oldLevel = getLevelForXP(profile.totalXP).level
    const newLevelDef = getLevelForXP(newTotalXP)
    const leveledUp = newLevelDef.level > oldLevel

    // Track decks reviewed
    const newDecksReviewed = new Set(state.sessionDecksReviewed)
    newDecksReviewed.add(deckId)

    // Update quest progress
    const newProfile: ProfileData = {
      ...profile,
      totalXP: newTotalXP,
      level: newLevelDef.level,
      xpHistory: [
        ...profile.xpHistory.slice(-99),
        { action: `Review (${response})`, xp: xpGained, timestamp: new Date() },
      ],
    }

    set({
      profile: newProfile,
      streakData: newStreakData,
      sessionXP: state.sessionXP + xpGained,
      sessionEasyStreak: newEasyStreak,
      sessionDecksReviewed: newDecksReviewed,
      sessionAgainCount: newAgainCount,
    })

    // Update quests
    get().updateQuestProgress('review_20', 1)
    get().updateQuestProgress('review_50', 1)
    if (response === ReviewResponse.Easy) {
      get().updateQuestProgress('easy_5', 1)
    }
    if (newDecksReviewed.size >= 3) {
      get().updateQuestProgress('three_decks', 1)
    }

    // Build event
    const event: GamificationEvent = {
      xpGained,
      leveledUp,
      newLevel: leveledUp ? newLevelDef.level : null,
      newAchievements: [],
      questsCompleted: [],
      streakXP,
    }

    // Save
    await get().saveProfile()

    // Add to pending events
    set((s) => ({ pendingEvents: [...s.pendingEvents, event] }))

    return event
  },

  onDeckCompleted: async () => {
    const { profile } = get()
    const xp = calculateDeckCompleteXP()
    const newTotalXP = profile.totalXP + xp
    const newLevelDef = getLevelForXP(newTotalXP)

    set((s) => ({
      profile: {
        ...s.profile,
        totalXP: newTotalXP,
        level: newLevelDef.level,
        xpHistory: [
          ...s.profile.xpHistory.slice(-99),
          { action: 'Deck complete', xp, timestamp: new Date() },
        ],
      },
      sessionXP: s.sessionXP + xp,
    }))

    await get().saveProfile()
    return xp
  },

  onSessionEnd: async (cardsReviewed, durationSeconds, accuracy, deckCount) => {
    const state = get()
    const { profile, streakData, sessionEasyStreak, sessionAgainCount } = state

    // Check achievements
    const ctx: AchievementContext = {
      streakData,
      totalXP: profile.totalXP,
      level: profile.level,
      sessionCardsReviewed: cardsReviewed,
      sessionDurationSeconds: durationSeconds,
      sessionEasyStreak,
      sessionAccuracy: accuracy,
      deckCount,
      isComeback: streakService.isComeback(streakData),
      currentHour: new Date().getHours(),
    }

    const newAchievements = checkAchievements(ctx, profile.achievements)

    // Check no_again quest
    if (cardsReviewed > 0 && sessionAgainCount === 0) {
      get().updateQuestProgress('no_again', 1)
    }

    // Check perfect day
    const quests = profile.dailyQuests
    const questsCompleted: string[] = []
    if (quests) {
      for (const q of quests.quests) {
        if (q.completed) {
          const def = getQuestDefinition(q.questId)
          if (def) questsCompleted.push(def.title)
        }
      }
    }

    // Award perfect day XP
    let perfectDayXP = 0
    if (quests?.allComplete) {
      perfectDayXP = XP_RULES.PERFECT_DAY
    }

    // Unlock achievements
    if (newAchievements.length > 0) {
      const unlocked: UnlockedAchievement[] = newAchievements.map((a) => ({
        id: a.id,
        unlockedAt: new Date(),
      }))

      set((s) => ({
        profile: {
          ...s.profile,
          achievements: [...s.profile.achievements, ...unlocked],
          totalXP: s.profile.totalXP + perfectDayXP,
        },
      }))

      await get().saveProfile()
    } else if (perfectDayXP > 0) {
      set((s) => ({
        profile: {
          ...s.profile,
          totalXP: s.profile.totalXP + perfectDayXP,
        },
      }))
      await get().saveProfile()
    }

    const event: GamificationEvent = {
      xpGained: perfectDayXP,
      leveledUp: false,
      newLevel: null,
      newAchievements,
      questsCompleted,
      streakXP: 0,
    }

    set((s) => ({ pendingEvents: [...s.pendingEvents, event] }))

    return event
  },

  ensureDailyQuests: () => {
    const { profile } = get()
    const today = new Date().toISOString().slice(0, 10)

    if (!profile.dailyQuests || profile.dailyQuests.date !== today) {
      const quests = generateDailyQuests()
      set((s) => ({
        profile: { ...s.profile, dailyQuests: quests },
      }))
    }
  },

  updateQuestProgress: (questId, increment) => {
    set((s) => {
      const quests = s.profile.dailyQuests
      if (!quests) return s

      const updated = quests.quests.map((q) => {
        if (q.questId !== questId || q.completed) return q
        const newCurrent = Math.min(q.current + increment, q.target)
        const completed = newCurrent >= q.target
        return {
          ...q,
          current: newCurrent,
          completed,
          completedAt: completed ? new Date() : null,
        }
      })

      const allComplete = updated.every((q) => q.completed)

      return {
        profile: {
          ...s.profile,
          dailyQuests: { ...quests, quests: updated, allComplete },
        },
      }
    })
  },

  resetSessionTracking: () => {
    set({
      sessionXP: 0,
      sessionEasyStreak: 0,
      sessionDecksReviewed: new Set(),
      sessionAgainCount: 0,
    })
  },

  consumeEvents: () => {
    const events = get().pendingEvents
    set({ pendingEvents: [] })
    return events
  },
}))
