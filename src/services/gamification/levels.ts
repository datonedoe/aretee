import { LevelDefinition } from '../../types'

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, title: 'Novice', xpRequired: 0, unlock: 'Basic flash mode' },
  { level: 2, title: 'Student', xpRequired: 500, unlock: 'Streak tracking' },
  { level: 3, title: 'Scholar', xpRequired: 1500, unlock: 'Socratic mode' },
  { level: 4, title: 'Thinker', xpRequired: 4000, unlock: 'Feynman mode' },
  { level: 5, title: 'Philosopher', xpRequired: 10000, unlock: 'Audio mode' },
  { level: 6, title: 'Adept', xpRequired: 18000, unlock: '' },
  { level: 7, title: 'Mentor', xpRequired: 28000, unlock: '' },
  { level: 8, title: 'Luminary', xpRequired: 40000, unlock: '' },
  { level: 9, title: 'Virtuoso', xpRequired: 45000, unlock: '' },
  { level: 10, title: 'Sage', xpRequired: 50000, unlock: 'Custom themes' },
  { level: 11, title: 'Savant', xpRequired: 65000, unlock: '' },
  { level: 12, title: 'Visionary', xpRequired: 85000, unlock: '' },
  { level: 13, title: 'Illuminated', xpRequired: 110000, unlock: '' },
  { level: 14, title: 'Transcendent', xpRequired: 135000, unlock: '' },
  { level: 15, title: 'Oracle', xpRequired: 150000, unlock: 'SkinUP' },
  { level: 16, title: 'Architect', xpRequired: 200000, unlock: '' },
  { level: 17, title: 'Sovereign', xpRequired: 275000, unlock: '' },
  { level: 18, title: 'Paragon', xpRequired: 375000, unlock: '' },
  { level: 19, title: 'Legend', xpRequired: 450000, unlock: '' },
  { level: 20, title: 'Polymath', xpRequired: 500000, unlock: '???' },
  { level: 21, title: 'Eternal', xpRequired: 600000, unlock: '' },
  { level: 22, title: 'Mythic', xpRequired: 725000, unlock: '' },
  { level: 23, title: 'Cosmic', xpRequired: 850000, unlock: '' },
  { level: 24, title: 'Infinite', xpRequired: 950000, unlock: '' },
  { level: 25, title: 'Aretee Master', xpRequired: 1000000, unlock: 'Golden profile' },
]

export function getLevelForXP(totalXP: number): LevelDefinition {
  let result = LEVEL_DEFINITIONS[0]
  for (const def of LEVEL_DEFINITIONS) {
    if (totalXP >= def.xpRequired) {
      result = def
    } else {
      break
    }
  }
  return result
}

export function getNextLevel(currentLevel: number): LevelDefinition | null {
  const idx = LEVEL_DEFINITIONS.findIndex((d) => d.level === currentLevel)
  if (idx === -1 || idx === LEVEL_DEFINITIONS.length - 1) return null
  return LEVEL_DEFINITIONS[idx + 1]
}

export function getLevelProgress(totalXP: number): {
  currentLevel: LevelDefinition
  nextLevel: LevelDefinition | null
  xpIntoLevel: number
  xpForNextLevel: number
  progress: number // 0..1
} {
  const currentLevel = getLevelForXP(totalXP)
  const nextLevel = getNextLevel(currentLevel.level)

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      xpIntoLevel: totalXP - currentLevel.xpRequired,
      xpForNextLevel: 0,
      progress: 1,
    }
  }

  const xpIntoLevel = totalXP - currentLevel.xpRequired
  const xpForNextLevel = nextLevel.xpRequired - currentLevel.xpRequired

  return {
    currentLevel,
    nextLevel,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 1,
  }
}
