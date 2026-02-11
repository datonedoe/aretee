import { AchievementDefinition, UnlockedAchievement } from '../../types'
import { StreakData } from '../../types'

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Streak achievements
  {
    id: 'first_flame',
    name: 'First Flame',
    icon: 'flame',
    description: '1-day streak',
    rarity: 'Common',
    condition: 'streak >= 1',
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    icon: 'flame',
    description: '7-day streak',
    rarity: 'Uncommon',
    condition: 'streak >= 7',
  },
  {
    id: 'month_master',
    name: 'Month Master',
    icon: 'flame',
    description: '30-day streak',
    rarity: 'Rare',
    condition: 'streak >= 30',
  },
  {
    id: 'century_club',
    name: 'Century Club',
    icon: 'flame',
    description: '100-day streak',
    rarity: 'Legendary',
    condition: 'streak >= 100',
  },

  // Review count achievements
  {
    id: 'first_steps',
    name: 'First Steps',
    icon: 'footsteps',
    description: 'Review your first card',
    rarity: 'Common',
    condition: 'totalReviews >= 1',
  },
  {
    id: 'century_reviews',
    name: 'Centurion',
    icon: 'shield',
    description: 'Review 100 cards',
    rarity: 'Uncommon',
    condition: 'totalReviews >= 100',
  },
  {
    id: 'thousand_reviews',
    name: 'Millennial',
    icon: 'trophy',
    description: 'Review 1,000 cards',
    rarity: 'Rare',
    condition: 'totalReviews >= 1000',
  },
  {
    id: 'ten_thousand_reviews',
    name: 'Titan',
    icon: 'planet',
    description: 'Review 10,000 cards',
    rarity: 'Legendary',
    condition: 'totalReviews >= 10000',
  },

  // Speed achievements
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    icon: 'flash',
    description: '50 cards in under 5 minutes',
    rarity: 'Uncommon',
    condition: '50 cards in < 5 min',
  },

  // Accuracy achievements
  {
    id: 'sniper',
    name: 'Sniper',
    icon: 'crosshair',
    description: '20 Easy ratings in a row',
    rarity: 'Epic',
    condition: '20 Easy in a row',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    icon: 'star',
    description: 'Complete a session with 100% accuracy',
    rarity: 'Uncommon',
    condition: 'session 100% good+easy',
  },

  // Domain achievements
  {
    id: 'renaissance_mind',
    name: 'Renaissance Mind',
    icon: 'library',
    description: 'Cards in 5+ domains',
    rarity: 'Rare',
    condition: '5+ deck domains',
  },

  // Secret achievements
  {
    id: 'brain_worm',
    name: 'Brain Worm',
    icon: 'moon',
    description: 'Review at 3 AM',
    rarity: 'Secret',
    condition: 'review between 3-4 AM',
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    icon: 'arrow-undo',
    description: 'Return after 7+ days away',
    rarity: 'Uncommon',
    condition: 'first review after 7+ day gap',
  },

  // Level achievements
  {
    id: 'level_5',
    name: 'Philosopher',
    icon: 'school',
    description: 'Reach level 5',
    rarity: 'Uncommon',
    condition: 'level >= 5',
  },
  {
    id: 'level_10',
    name: 'Sage',
    icon: 'sparkles',
    description: 'Reach level 10',
    rarity: 'Rare',
    condition: 'level >= 10',
  },
  {
    id: 'level_25',
    name: 'Aretee Master',
    icon: 'diamond',
    description: 'Reach level 25',
    rarity: 'Legendary',
    condition: 'level >= 25',
  },
]

export interface AchievementContext {
  streakData: StreakData
  totalXP: number
  level: number
  sessionCardsReviewed: number
  sessionDurationSeconds: number
  sessionEasyStreak: number
  sessionAccuracy: number // 0-100
  deckCount: number
  isComeback: boolean
  currentHour: number
}

export function checkAchievements(
  context: AchievementContext,
  alreadyUnlocked: UnlockedAchievement[]
): AchievementDefinition[] {
  const unlockedIds = new Set(alreadyUnlocked.map((a) => a.id))
  const newlyUnlocked: AchievementDefinition[] = []

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (unlockedIds.has(def.id)) continue

    if (isAchievementMet(def.id, context)) {
      newlyUnlocked.push(def)
    }
  }

  return newlyUnlocked
}

function isAchievementMet(id: string, ctx: AchievementContext): boolean {
  switch (id) {
    // Streak
    case 'first_flame': return ctx.streakData.summary.currentStreak >= 1
    case 'week_warrior': return ctx.streakData.summary.currentStreak >= 7
    case 'month_master': return ctx.streakData.summary.currentStreak >= 30
    case 'century_club': return ctx.streakData.summary.currentStreak >= 100

    // Review count
    case 'first_steps': return ctx.streakData.summary.totalReviews >= 1
    case 'century_reviews': return ctx.streakData.summary.totalReviews >= 100
    case 'thousand_reviews': return ctx.streakData.summary.totalReviews >= 1000
    case 'ten_thousand_reviews': return ctx.streakData.summary.totalReviews >= 10000

    // Speed
    case 'speed_demon':
      return ctx.sessionCardsReviewed >= 50 && ctx.sessionDurationSeconds < 300

    // Accuracy
    case 'sniper': return ctx.sessionEasyStreak >= 20
    case 'perfectionist':
      return ctx.sessionCardsReviewed >= 5 && ctx.sessionAccuracy === 100

    // Domain
    case 'renaissance_mind': return ctx.deckCount >= 5

    // Secret
    case 'brain_worm': return ctx.currentHour >= 3 && ctx.currentHour < 4
    case 'comeback_kid': return ctx.isComeback

    // Level
    case 'level_5': return ctx.level >= 5
    case 'level_10': return ctx.level >= 10
    case 'level_25': return ctx.level >= 25

    default: return false
  }
}
