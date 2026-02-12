import { ImmersionItem, ContentType } from '../../types/immersion'

// TODO: Make configurable
const API_BASE = 'http://localhost:8000/api/immersion'

interface GenerateParams {
  topic?: string
  difficulty_level: number
  content_type: ContentType
  language: string
  region?: string
}

export async function generateImmersionItem(params: GenerateParams): Promise<ImmersionItem> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`)
  return res.json()
}

export async function generateBatch(
  params: GenerateParams,
  count: number = 5
): Promise<ImmersionItem[]> {
  const res = await fetch(`${API_BASE}/generate-batch?count=${count}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Batch generate failed: ${res.status}`)
  return res.json()
}

export async function translateWord(
  word: string,
  language: string,
  context: string = ''
): Promise<{ word: string; translation: string; part_of_speech: string; example: string }> {
  const res = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, language, context }),
  })
  if (!res.ok) throw new Error(`Translate failed: ${res.status}`)
  return res.json()
}

export async function fetchFeed(limit: number = 20, offset: number = 0): Promise<ImmersionItem[]> {
  const res = await fetch(`${API_BASE}/feed?limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error(`Fetch feed failed: ${res.status}`)
  return res.json()
}
