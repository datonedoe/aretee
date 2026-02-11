import { QuestDefinition, QuestProgress, DailyQuests } from '../../types'
import { format } from 'date-fns'
import { XP_RULES } from './xp'

const CORE_QUESTS: QuestDefinition[] = [
  {
    id: 'review_20',
    type: 'core',
    title: 'Daily Review',
    description: 'Review 20 due cards',
    target: 20,
    xpReward: XP_RULES.COMPLETE_QUEST,
  },
]

const MODE_QUESTS: QuestDefinition[] = [
  {
    id: 'socratic_1',
    type: 'mode',
    title: 'Socratic Dialogue',
    description: 'Complete 1 Socratic session',
    target: 1,
    xpReward: XP_RULES.COMPLETE_QUEST,
  },
  {
    id: 'feynman_1',
    type: 'mode',
    title: 'Feynman Technique',
    description: 'Explain 1 concept in Feynman Mode',
    target: 1,
    xpReward: XP_RULES.COMPLETE_QUEST,
  },
]

const STRETCH_QUESTS: QuestDefinition[] = [
  {
    id: 'easy_5',
    type: 'stretch',
    title: 'Sharp Mind',
    description: 'Get 5 Easy ratings',
    target: 5,
    xpReward: XP_RULES.COMPLETE_QUEST,
  },
  {
    id: 'review_50',
    type: 'stretch',
    title: 'Marathon',
    description: 'Review 50 cards total',
    target: 50,
    xpReward: XP_RULES.COMPLETE_QUEST,
  },
  {
    id: 'no_again',
    type: 'stretch',
    title: 'No Mistakes',
    description: 'Complete a session without pressing Again',
    target: 1,
    xpReward: XP_RULES.COMPLETE_QUEST,
  },
  {
    id: 'three_decks',
    type: 'stretch',
    title: 'Well Rounded',
    description: 'Review cards from 3 different decks',
    target: 3,
    xpReward: XP_RULES.COMPLETE_QUEST,
  },
]

export function generateDailyQuests(): DailyQuests {
  const today = format(new Date(), 'yyyy-MM-dd')

  // Deterministic "random" stretch quest based on day
  const dayNum = new Date().getDate()
  const stretchQuest = STRETCH_QUESTS[dayNum % STRETCH_QUESTS.length]

  // Deterministic mode quest based on day
  const modeQuest = MODE_QUESTS[dayNum % MODE_QUESTS.length]

  const quests: QuestProgress[] = [
    // Core quest — always present
    {
      questId: CORE_QUESTS[0].id,
      current: 0,
      target: CORE_QUESTS[0].target,
      completed: false,
      completedAt: null,
    },
    // Mode quest — rotates daily
    {
      questId: modeQuest.id,
      current: 0,
      target: modeQuest.target,
      completed: false,
      completedAt: null,
    },
    // Stretch quest — rotates daily
    {
      questId: stretchQuest.id,
      current: 0,
      target: stretchQuest.target,
      completed: false,
      completedAt: null,
    },
  ]

  return {
    date: today,
    quests,
    allComplete: false,
  }
}

export function getQuestDefinition(questId: string): QuestDefinition | undefined {
  return [...CORE_QUESTS, ...MODE_QUESTS, ...STRETCH_QUESTS].find((q) => q.id === questId)
}

export function getAllQuestDefinitions(): QuestDefinition[] {
  return [...CORE_QUESTS, ...MODE_QUESTS, ...STRETCH_QUESTS]
}
