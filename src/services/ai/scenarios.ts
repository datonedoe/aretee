/**
 * Sprint 12: Deep Conversation Scenarios
 * Scenario library with branching dialogue setups.
 */

import { Scenario, RegisterLevel } from '../../types/conversation'
import { getCharactersForScenario } from './characters'

interface ScenarioTemplate {
  id: string
  title: string
  description: string
  settingEmoji: string
  characterIds: string[]
  openingLine: string
  difficultyLevel: 1 | 2 | 3 | 4 | 5
  targetRegister: RegisterLevel
  tags: string[]
  estimatedMinutes: number
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'ordering-food',
    title: 'Ordering Food (with complications)',
    description:
      'You walk into María\'s restaurant. She\'s eager to serve you, but half the menu is sold out and she keeps pushing the daily special. Can you navigate the meal without accidentally ordering tripe?',
    settingEmoji: '🍽️',
    characterIds: ['maria'],
    openingLine:
      '¡Bienvenido, bienvenido! Pase, pase. ¿Mesa para uno? Mira, tengo la mejor mesa junto a la ventana. Hoy el especial es mi mole negro — el de la receta de mi abuelita. ¿Qué le sirvo?',
    difficultyLevel: 2,
    targetRegister: 'informal',
    tags: ['food', 'daily-life', 'beginner-friendly'],
    estimatedMinutes: 5,
  },
  {
    id: 'negotiating-rent',
    title: 'Negotiating Rent',
    description:
      'Your landlord Don Rafael wants to raise the rent by 20%. You need to convince him to keep it reasonable — or at least get something in return. He respects directness but won\'t be pushed around.',
    settingEmoji: '🏠',
    characterIds: ['don_rafael'],
    openingLine:
      'Buenas tardes. Pase, siéntese. Le mandé el aviso sobre el ajuste de renta. Ya sabe cómo están las cosas — todo sube. El nuevo monto empieza el mes que viene. ¿Tiene alguna pregunta?',
    difficultyLevel: 4,
    targetRegister: 'formal',
    tags: ['negotiation', 'housing', 'formal', 'advanced'],
    estimatedMinutes: 10,
  },
  {
    id: 'flirting-at-bar',
    title: 'Flirting at a Bar',
    description:
      'You\'re at a trendy mezcal bar and catch the bartender Valentina\'s eye. She\'s sharp, funny, and not easily impressed. Can you hold your own in a flirty conversation without being cringe?',
    settingEmoji: '🍸',
    characterIds: ['valentina'],
    openingLine:
      '¿Qué te sirvo? Y antes de que digas "lo que tú me recomiendes" — eso me lo dicen veinte veces por noche. Sorpréndeme.',
    difficultyLevel: 3,
    targetRegister: 'street',
    tags: ['social', 'slang', 'humor', 'street-language'],
    estimatedMinutes: 8,
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    description:
      'Carlos from HR is interviewing you for a position at a tech company. He\'s professional but perceptive — he\'ll notice if you\'re faking it. First impressions matter.',
    settingEmoji: '💼',
    characterIds: ['carlos'],
    openingLine:
      'Buen día, gracias por venir. Tome asiento, por favor. He revisado su currículum y tengo algunas preguntas. Primero, cuénteme: ¿por qué le interesa este puesto?',
    difficultyLevel: 4,
    targetRegister: 'professional',
    tags: ['professional', 'formal', 'career', 'advanced'],
    estimatedMinutes: 10,
  },
  {
    id: 'customer-service',
    title: 'Complaining to Customer Service',
    description:
      'Your internet has been down for three days. Sofía picks up the phone. She\'s following a script but you need actual help, not another "reboot your modem." How far can patience take you?',
    settingEmoji: '📞',
    characterIds: ['sofia'],
    openingLine:
      'Gracias por llamar a TeleMex, mi nombre es Sofía. ¿En qué puedo ayudarle el día de hoy? ¿Me podría proporcionar su número de cuenta, por favor?',
    difficultyLevel: 3,
    targetRegister: 'formal',
    tags: ['phone', 'complaint', 'patience', 'formal'],
    estimatedMinutes: 8,
  },
  {
    id: 'arguing-partner',
    title: 'Arguing with Your Partner',
    description:
      'You forgot Lucía\'s birthday dinner reservation. She\'s not yelling — which is worse. Navigate this emotionally charged conversation without making it worse.',
    settingEmoji: '💔',
    characterIds: ['lucia'],
    openingLine:
      '...Ah, ya llegaste. ¿Qué tal tu día? El mío estuvo... interesante. Estuve esperando tu mensaje. Pero bueno, cuéntame — ¿qué hiciste hoy?',
    difficultyLevel: 5,
    targetRegister: 'informal',
    tags: ['emotional', 'relationship', 'advanced', 'register-mixing'],
    estimatedMinutes: 10,
  },
  {
    id: 'party-small-talk',
    title: 'Small Talk at a Party',
    description:
      'Diego invited you to his asado and you don\'t know anyone. He\'s introducing you around. Keep the conversation flowing with strangers while he bounces between guests.',
    settingEmoji: '🎉',
    characterIds: ['diego'],
    openingLine:
      '¡Eyyy, llegaste! ¡Qué buena onda! Pasa, pasa — agarra una chela de la hielera. Mira, te presento — bueno, primero cuéntame, ¿cómo estuvo tu semana? Porque la mía fue una LOCURA.',
    difficultyLevel: 2,
    targetRegister: 'informal',
    tags: ['social', 'casual', 'small-talk', 'beginner-friendly'],
    estimatedMinutes: 5,
  },
]

/**
 * Hydrate scenario templates into full Scenario objects with character data.
 */
export function getScenarios(): Scenario[] {
  return SCENARIO_TEMPLATES.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    settingEmoji: t.settingEmoji,
    characters: getCharactersForScenario(t.characterIds),
    openingLine: t.openingLine,
    difficultyLevel: t.difficultyLevel,
    targetRegister: t.targetRegister,
    tags: t.tags,
    estimatedMinutes: t.estimatedMinutes,
  }))
}

export function getScenario(id: string): Scenario | undefined {
  return getScenarios().find((s) => s.id === id)
}

export function getScenariosByDifficulty(level: number): Scenario[] {
  return getScenarios().filter((s) => s.difficultyLevel <= level)
}

export function getScenariosByTag(tag: string): Scenario[] {
  return getScenarios().filter((s) => s.tags.includes(tag))
}
