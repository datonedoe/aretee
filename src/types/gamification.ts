export type AchievementRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Secret'

export interface AchievementDefinition {
  id: string
  name: string
  icon: string
  description: string
  rarity: AchievementRarity
  condition: string // Human-readable condition
}

export interface UnlockedAchievement {
  id: string
  unlockedAt: Date
}

export interface LevelDefinition {
  level: number
  title: string
  xpRequired: number
  unlock: string
}

export interface QuestDefinition {
  id: string
  type: 'core' | 'mode' | 'stretch'
  title: string
  description: string
  target: number
  xpReward: number
}

export interface QuestProgress {
  questId: string
  current: number
  target: number
  completed: boolean
  completedAt: Date | null
}

export interface DailyQuests {
  date: string // YYYY-MM-DD
  quests: QuestProgress[]
  allComplete: boolean
}

export interface XPEvent {
  action: string
  xp: number
  timestamp: Date
}

export interface ProfileData {
  totalXP: number
  level: number
  achievements: UnlockedAchievement[]
  dailyQuests: DailyQuests | null
  xpHistory: XPEvent[]
}

export const DEFAULT_PROFILE_DATA: ProfileData = {
  totalXP: 0,
  level: 1,
  achievements: [],
  dailyQuests: null,
  xpHistory: [],
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  Common: '#9A9AB0',
  Uncommon: '#10B981',
  Rare: '#3B82F6',
  Epic: '#6C3CE1',
  Legendary: '#F59E0B',
  Secret: '#F43F5E',
}
