import { sendMessage, Message, StreamCallbacks } from './client'
import { buildSocraticSystemPrompt, buildOpeningQuestion } from './prompts'
import { Card } from '../../types'

export interface SocraticSession {
  id: string
  card: Card
  messages: SocraticMessage[]
  startedAt: Date
  insightReached: boolean
  exchangeCount: number
}

export interface SocraticMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isInsight?: boolean
}

export function startSocraticDialogue(card: Card): {
  session: SocraticSession
  openingMessage: SocraticMessage
} {
  const opening = buildOpeningQuestion(card.question, card.answer, card.ease)

  const session: SocraticSession = {
    id: `socratic-${Date.now()}`,
    card,
    messages: [],
    startedAt: new Date(),
    insightReached: false,
    exchangeCount: 0,
  }

  const openingMessage: SocraticMessage = {
    role: 'assistant',
    content: opening,
    timestamp: new Date(),
  }

  session.messages.push(openingMessage)

  return { session, openingMessage }
}

export async function sendSocraticReply(
  session: SocraticSession,
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<{ updatedSession: SocraticSession; isInsight: boolean }> {
  const systemPrompt = buildSocraticSystemPrompt(
    session.card.question,
    session.card.answer,
    session.card.ease
  )

  // Add user message to session
  const userMsg: SocraticMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  }

  const updatedMessages = [...session.messages, userMsg]

  // Convert to API format
  const apiMessages: Message[] = updatedMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  let isInsight = false

  // Wrap callbacks to detect insight
  const wrappedCallbacks: StreamCallbacks = {
    onToken: callbacks.onToken,
    onComplete: (fullText: string) => {
      isInsight = fullText.includes('[INSIGHT]')
      callbacks.onComplete(fullText)
    },
    onError: callbacks.onError,
  }

  await sendMessage(systemPrompt, apiMessages, wrappedCallbacks)

  const updatedSession: SocraticSession = {
    ...session,
    messages: updatedMessages,
    exchangeCount: session.exchangeCount + 1,
    insightReached: isInsight || session.insightReached,
  }

  return { updatedSession, isInsight }
}

export function cleanInsightMarker(text: string): string {
  return text.replace('[INSIGHT]', '').trim()
}

export function hasMinimumExchanges(session: SocraticSession): boolean {
  return session.exchangeCount >= 5
}
