export interface VocabItem {
  word: string
  meaning: string
  difficulty: number
}

export interface ImmersionItem {
  id: string
  content_type: ContentType
  text: string
  translation: string
  vocabulary: VocabItem[]
  audio_text: string
  audio_url: string | null
  topic: string
  difficulty_level: number
  language: string
  region: string | null
  has_profanity: boolean
  created_at: number
}

export type ContentType = 'dialogue' | 'news' | 'cultural' | 'overheard' | 'slang'

export type FeedInteraction = 'too_easy' | 'too_hard' | 'engaged' | 'skipped'

export interface FeedInteractionRecord {
  itemId: string
  interaction: FeedInteraction
  timestamp: number
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  dialogue: '💬 Dialogue',
  news: '📰 News',
  cultural: '🏛️ Cultural',
  overheard: '👂 Overheard',
  slang: '🔥 Street',
}

export const CONTENT_TYPES: ContentType[] = ['dialogue', 'news', 'cultural', 'overheard', 'slang']
