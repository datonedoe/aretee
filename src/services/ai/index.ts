export { sendMessage, sendMessageSync } from './client'
export type { Message, StreamCallbacks } from './client'
export { buildSocraticSystemPrompt, buildOpeningQuestion } from './prompts'
export {
  startSocraticDialogue,
  sendSocraticReply,
  cleanInsightMarker,
  hasMinimumExchanges,
} from './socratic'
export type { SocraticSession, SocraticMessage } from './socratic'
