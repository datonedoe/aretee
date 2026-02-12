export interface Episode {
  id: string
  title: string
  cards: { question: string; answer: string }[]
  script: string
  audioUrl: string
  durationEstimate: number // seconds
  createdAt: number // unix timestamp
}

export interface AudioPlaybackState {
  isPlaying: boolean
  currentEpisodeId: string | null
  position: number // seconds
  duration: number // seconds
  playbackSpeed: number
  isLoading: boolean
}

export const DEFAULT_PLAYBACK_STATE: AudioPlaybackState = {
  isPlaying: false,
  currentEpisodeId: null,
  position: 0,
  duration: 0,
  playbackSpeed: 1.0,
  isLoading: false,
}
