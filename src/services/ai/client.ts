import { Platform } from 'react-native'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onComplete: (fullText: string) => void
  onError: (error: Error) => void
}

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-3-5-haiku-latest'
const MAX_TOKENS = 512

function getApiKey(): string {
  // Access env var — works in Node/web environments
  const key =
    typeof process !== 'undefined' && process.env
      ? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY
      : undefined

  if (!key) {
    throw new Error(
      'ANTHROPIC_API_KEY not set. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.'
    )
  }
  return key
}

export async function sendMessage(
  systemPrompt: string,
  messages: Message[],
  callbacks: StreamCallbacks
): Promise<void> {
  const apiKey = getApiKey()

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body for streaming')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta'
            ) {
              const token = parsed.delta.text
              fullText += token
              callbacks.onToken(token)
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    callbacks.onComplete(fullText)
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function sendMessageSync(
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const apiKey = getApiKey()

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}
