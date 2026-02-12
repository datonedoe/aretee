import { describe, it, expect } from 'vitest'
import { ReviewResponse } from '../types'
import {
  calculateReviewXP,
  calculateDeckCompleteXP,
  calculateStreakXP,
  calculateComebackXP,
  XP_RULES,
} from '../services/gamification/xp'
import {
  getLevelForXP,
  getNextLevel,
  getLevelProgress,
  LEVEL_DEFINITIONS,
} from '../services/gamification/levels'
import {
  checkAchievements,
  ACHIEVEMENT_DEFINITIONS,
  type AchievementContext,
} from '../services/gamification/achievements'
import {
  generateDailyQuests,
  getQuestDefinition,
  getAllQuestDefinitions,
} from '../services/gamification/quests'
import { DEFAULT_STREAK_DATA, type StreakData } from '../types'

// --- XP ---
describe('XP Calculations', () => {
  it('Again gives base XP (10)', () => {
    expect(calculateReviewXP(ReviewResponse.Again)).toBe(XP_RULES.REVIEW_CARD)
  })

  it('Hard gives base XP (10)', () => {
    expect(calculateReviewXP(ReviewResponse.Hard)).toBe(XP_RULES.REVIEW_CARD)
  })

  it('Good gives base XP (10)', () => {
    expect(calculateReviewXP(ReviewResponse.Good)).toBe(XP_RULES.REVIEW_CARD)
  })

  it('Easy gives base + bonus (15)', () => {
    expect(calculateReviewXP(ReviewResponse.Easy)).toBe(XP_RULES.REVIEW_CARD + XP_RULES.EASY_BONUS)
  })

  it('deck complete gives 50 XP', () => {
    expect(calculateDeckCompleteXP()).toBe(50)
  })

  it('streak XP = 25 * day number', () => {
    expect(calculateStreakXP(1)).toBe(25)
    expect(calculateStreakXP(7)).toBe(175)
    expect(calculateStreakXP(30)).toBe(750)
  })

  it('comeback bonus is 50', () => {
    expect(calculateComebackXP()).toBe(50)
  })
})

// --- Levels ---
describe('Level System', () => {
  it('0 XP → Level 1 Novice', () => {
    const level = getLevelForXP(0)
    expect(level.level).toBe(1)
    expect(level.title).toBe('Novice')
  })

  it('500 XP → Level 2 Student', () => {
    const level = getLevelForXP(500)
    expect(level.level).toBe(2)
    expect(level.title).toBe('Student')
  })

  it('499 XP → still Level 1', () => {
    const level = getLevelForXP(499)
    expect(level.level).toBe(1)
  })

  it('1,000,000 XP → Level 25 Aretee Master', () => {
    const level = getLevelForXP(1000000)
    expect(level.level).toBe(25)
    expect(level.title).toBe('Aretee Master')
  })

  it('negative XP → Level 1 (no crash)', () => {
    const level = getLevelForXP(-100)
    expect(level.level).toBe(1)
  })

  it('very large XP → max level', () => {
    const level = getLevelForXP(999999999)
    expect(level.level).toBe(25)
  })

  it('getNextLevel(1) → Level 2', () => {
    const next = getNextLevel(1)
    expect(next).not.toBeNull()
    expect(next!.level).toBe(2)
  })

  it('getNextLevel(25) → null (max)', () => {
    expect(getNextLevel(25)).toBeNull()
  })

  it('getNextLevel(99) → null (invalid)', () => {
    expect(getNextLevel(99)).toBeNull()
  })

  it('getLevelProgress at 0 XP → progress 0', () => {
    const p = getLevelProgress(0)
    expect(p.currentLevel.level).toBe(1)
    expect(p.xpIntoLevel).toBe(0)
    expect(p.progress).toBe(0)
  })

  it('getLevelProgress at 250 XP → halfway to level 2', () => {
    const p = getLevelProgress(250)
    expect(p.currentLevel.level).toBe(1)
    expect(p.nextLevel!.level).toBe(2)
    expect(p.progress).toBeCloseTo(0.5)
  })

  it('getLevelProgress at max → progress 1', () => {
    const p = getLevelProgress(1000000)
    expect(p.progress).toBe(1)
    expect(p.nextLevel).toBeNull()
  })

  it('level definitions are sorted by xpRequired', () => {
    for (let i = 1; i < LEVEL_DEFINITIONS.length; i++) {
      expect(LEVEL_DEFINITIONS[i].xpRequired).toBeGreaterThan(LEVEL_DEFINITIONS[i - 1].xpRequired)
    }
  })
})

// --- Achievements ---
describe('Achievement Checks', () => {
  const baseContext: AchievementContext = {
    streakData: {
      ...DEFAULT_STREAK_DATA,
      summary: { ...DEFAULT_STREAK_DATA.summary, currentStreak: 0, totalReviews: 0 },
    },
    totalXP: 0,
    level: 1,
    sessionCardsReviewed: 0,
    sessionDurationSeconds: 0,
    sessionEasyStreak: 0,
    sessionAccuracy: 0,
    deckCount: 0,
    isComeback: false,
    currentHour: 12,
  }

  it('streak=1 unlocks first_flame', () => {
    const ctx = {
      ...baseContext,
      streakData: {
        ...baseContext.streakData,
        summary: { ...baseContext.streakData.summary, currentStreak: 1 },
      },
    }
    const unlocked = checkAchievements(ctx, [])
    expect(unlocked.some((a) => a.id === 'first_flame')).toBe(true)
  })

  it('already unlocked achievements are skipped', () => {
    const ctx = {
      ...baseContext,
      streakData: {
        ...baseContext.streakData,
        summary: { ...baseContext.streakData.summary, currentStreak: 1 },
      },
    }
    const unlocked = checkAchievements(ctx, [{ id: 'first_flame', unlockedAt: new Date() }])
    expect(unlocked.some((a) => a.id === 'first_flame')).toBe(false)
  })

  it('brain_worm only at 3-4 AM', () => {
    const at3am = checkAchievements({ ...baseContext, currentHour: 3 }, [])
    const atNoon = checkAchievements({ ...baseContext, currentHour: 12 }, [])
    expect(at3am.some((a) => a.id === 'brain_worm')).toBe(true)
    expect(atNoon.some((a) => a.id === 'brain_worm')).toBe(false)
  })

  it('speed_demon: 50 cards in < 5 min', () => {
    const ctx = { ...baseContext, sessionCardsReviewed: 50, sessionDurationSeconds: 299 }
    const unlocked = checkAchievements(ctx, [])
    expect(unlocked.some((a) => a.id === 'speed_demon')).toBe(true)
  })

  it('speed_demon NOT unlocked: 49 cards', () => {
    const ctx = { ...baseContext, sessionCardsReviewed: 49, sessionDurationSeconds: 200 }
    const unlocked = checkAchievements(ctx, [])
    expect(unlocked.some((a) => a.id === 'speed_demon')).toBe(false)
  })

  it('perfectionist: 5+ cards, 100% accuracy', () => {
    const ctx = { ...baseContext, sessionCardsReviewed: 5, sessionAccuracy: 100 }
    const unlocked = checkAchievements(ctx, [])
    expect(unlocked.some((a) => a.id === 'perfectionist')).toBe(true)
  })

  it('perfectionist NOT unlocked: 99% accuracy', () => {
    const ctx = { ...baseContext, sessionCardsReviewed: 10, sessionAccuracy: 99 }
    const unlocked = checkAchievements(ctx, [])
    expect(unlocked.some((a) => a.id === 'perfectionist')).toBe(false)
  })

  it('comeback_kid when isComeback=true', () => {
    const unlocked = checkAchievements({ ...baseContext, isComeback: true }, [])
    expect(unlocked.some((a) => a.id === 'comeback_kid')).toBe(true)
  })

  it('renaissance_mind: 5+ decks', () => {
    const unlocked = checkAchievements({ ...baseContext, deckCount: 5 }, [])
    expect(unlocked.some((a) => a.id === 'renaissance_mind')).toBe(true)
  })

  it('sniper: 20 easy in a row', () => {
    const unlocked = checkAchievements({ ...baseContext, sessionEasyStreak: 20 }, [])
    expect(unlocked.some((a) => a.id === 'sniper')).toBe(true)
  })

  it('level achievements unlock at threshold', () => {
    const ctx5 = { ...baseContext, level: 5 }
    const ctx10 = { ...baseContext, level: 10 }
    const ctx25 = { ...baseContext, level: 25 }
    expect(checkAchievements(ctx5, []).some((a) => a.id === 'level_5')).toBe(true)
    expect(checkAchievements(ctx10, []).some((a) => a.id === 'level_10')).toBe(true)
    expect(checkAchievements(ctx25, []).some((a) => a.id === 'level_25')).toBe(true)
  })

  it('week_warrior: 7-day streak', () => {
    const ctx = {
      ...baseContext,
      streakData: {
        ...baseContext.streakData,
        summary: { ...baseContext.streakData.summary, currentStreak: 7 },
      },
    }
    const unlocked = checkAchievements(ctx, [])
    expect(unlocked.some((a) => a.id === 'week_warrior')).toBe(true)
  })
})

// --- Quests ---
describe('Daily Quests', () => {
  it('generates 3 quests (core, mode, stretch)', () => {
    const quests = generateDailyQuests()
    expect(quests.quests).toHaveLength(3)
    expect(quests.allComplete).toBe(false)
    expect(quests.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('all quests start at 0 progress', () => {
    const quests = generateDailyQuests()
    for (const q of quests.quests) {
      expect(q.current).toBe(0)
      expect(q.completed).toBe(false)
      expect(q.completedAt).toBeNull()
    }
  })

  it('core quest is always review_20', () => {
    const quests = generateDailyQuests()
    expect(quests.quests[0].questId).toBe('review_20')
    expect(quests.quests[0].target).toBe(20)
  })

  it('getQuestDefinition returns correct definition', () => {
    const def = getQuestDefinition('review_20')
    expect(def).toBeDefined()
    expect(def!.title).toBe('Daily Review')
    expect(def!.target).toBe(20)
  })

  it('getQuestDefinition returns undefined for nonexistent', () => {
    expect(getQuestDefinition('nonexistent')).toBeUndefined()
  })

  it('getAllQuestDefinitions returns all quests', () => {
    const all = getAllQuestDefinitions()
    expect(all.length).toBeGreaterThanOrEqual(7) // 1 core + 3 mode + 4 stretch
  })
})
