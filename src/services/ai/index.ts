export { sendMessage, sendMessageSync } from './client'
export type { Message, StreamCallbacks } from './client'
export { buildSocraticSystemPrompt, buildOpeningQuestion, buildFeynmanSystemPrompt } from './prompts'
export {
  startSocraticDialogue,
  sendSocraticReply,
  cleanInsightMarker,
  hasMinimumExchanges,
} from './socratic'
export type { SocraticSession, SocraticMessage } from './socratic'
export {
  startFeynmanSession,
  gradeExplanation,
  gradeFollowUp,
  calculateFeynmanXP,
} from './feynman'
export type { FeynmanSession, FeynmanGrade, FeynmanDimensionScore, FeynmanHistoryEntry } from './feynman'
