import { Episode } from '../../types/audio'

// Backend URL — configurable via env var, defaults to localhost
const BASE_URL =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_BACKEND_URL
    ? process.env.EXPO_PUBLIC_BACKEND_URL
    : 'http://localhost:8000'

export async function generateEpisode(
  title: string,
  cards: { question: string; answer: string }[]
): Promise<Episode> {
  const response = await fetch(`${BASE_URL}/api/audio/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, cards }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to generate episode: ${text}`)
  }

  const episode = await response.json()
  // Prefix audio URL with backend base
  episode.audioUrl = `${BASE_URL}${episode.audioUrl}`
  return episode
}

export async function fetchEpisodes(): Promise<Episode[]> {
  const response = await fetch(`${BASE_URL}/api/audio/episodes`)

  if (!response.ok) {
    throw new Error('Failed to fetch episodes')
  }

  const episodes: Episode[] = await response.json()
  // Prefix audio URLs
  return episodes.map((ep) => ({
    ...ep,
    audioUrl: `${BASE_URL}${ep.audioUrl}`,
  }))
}

export async function deleteEpisode(episodeId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/audio/episodes/${episodeId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete episode')
  }
}
