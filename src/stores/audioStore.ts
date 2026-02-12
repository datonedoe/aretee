import { create } from 'zustand'
import { Episode, AudioPlaybackState, DEFAULT_PLAYBACK_STATE } from '../types/audio'
import { fetchEpisodes, generateEpisode, deleteEpisode as apiDeleteEpisode } from '../services/audio/api'
import { getAudioPlayer } from '../services/audio/player'
import { playSound } from '../services/audio/sounds'
import { useProfileStore } from './profileStore'

const LISTEN_XP = 75
const LISTEN_QUEST_ID = 'listen_1'

interface AudioState {
  episodes: Episode[]
  isLoadingEpisodes: boolean
  isGenerating: boolean
  generateError: string | null
  playback: AudioPlaybackState
  listenedEpisodes: Set<string>

  loadEpisodes: () => Promise<void>
  generateNewEpisode: (
    title: string,
    cards: { question: string; answer: string }[]
  ) => Promise<Episode>
  deleteEpisode: (episodeId: string) => Promise<void>

  playEpisode: (episodeId: string) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => Promise<void>
  seekTo: (seconds: number) => Promise<void>
  setSpeed: (rate: number) => Promise<void>

  getCurrentEpisode: () => Episode | null
}

export const useAudioStore = create<AudioState>((set, get) => ({
  episodes: [],
  isLoadingEpisodes: false,
  isGenerating: false,
  generateError: null,
  playback: { ...DEFAULT_PLAYBACK_STATE },
  listenedEpisodes: new Set(),

  loadEpisodes: async () => {
    set({ isLoadingEpisodes: true })
    try {
      const episodes = await fetchEpisodes()
      set({ episodes, isLoadingEpisodes: false })
    } catch {
      set({ isLoadingEpisodes: false })
    }
  },

  generateNewEpisode: async (title, cards) => {
    set({ isGenerating: true, generateError: null })
    try {
      const episode = await generateEpisode(title, cards)
      set((s) => ({
        episodes: [episode, ...s.episodes],
        isGenerating: false,
      }))
      return episode
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      set({ isGenerating: false, generateError: message })
      throw err
    }
  },

  deleteEpisode: async (episodeId) => {
    await apiDeleteEpisode(episodeId)
    const { playback } = get()
    if (playback.currentEpisodeId === episodeId) {
      getAudioPlayer().unload()
      set({ playback: { ...DEFAULT_PLAYBACK_STATE } })
    }
    set((s) => ({
      episodes: s.episodes.filter((e) => e.id !== episodeId),
    }))
  },

  playEpisode: async (episodeId) => {
    const { episodes } = get()
    const episode = episodes.find((e) => e.id === episodeId)
    if (!episode) return

    set({
      playback: {
        ...DEFAULT_PLAYBACK_STATE,
        currentEpisodeId: episodeId,
        isLoading: true,
      },
    })

    const player = getAudioPlayer()

    player.onStatus((status) => {
      set((s) => ({
        playback: {
          ...s.playback,
          isPlaying: status.isPlaying,
          position: status.position,
          duration: status.duration,
          isLoading: false,
        },
      }))

      // Award XP when episode completes (>90% listened)
      if (
        status.duration > 0 &&
        status.position >= status.duration * 0.9 &&
        !status.isPlaying
      ) {
        const state = get()
        if (!state.listenedEpisodes.has(episodeId)) {
          set((s) => {
            const updated = new Set(s.listenedEpisodes)
            updated.add(episodeId)
            return { listenedEpisodes: updated }
          })

          // Award XP
          const profileStore = useProfileStore.getState()
          const newTotalXP = profileStore.profile.totalXP + LISTEN_XP
          useProfileStore.setState((s) => ({
            profile: {
              ...s.profile,
              totalXP: newTotalXP,
              xpHistory: [
                ...s.profile.xpHistory.slice(-99),
                {
                  action: 'Audio episode completed',
                  xp: LISTEN_XP,
                  timestamp: new Date(),
                },
              ],
            },
          }))
          profileStore.saveProfile()
          profileStore.updateQuestProgress(LISTEN_QUEST_ID, 1)
          playSound('xp')
        }
      }
    })

    try {
      await player.load(episode.audioUrl)
      await player.setSpeed(get().playback.playbackSpeed)
      await player.play()
    } catch {
      set((s) => ({
        playback: { ...s.playback, isLoading: false },
      }))
    }
  },

  pause: async () => {
    await getAudioPlayer().pause()
  },

  resume: async () => {
    await getAudioPlayer().play()
  },

  stop: async () => {
    await getAudioPlayer().stop()
    getAudioPlayer().unload()
    set({ playback: { ...DEFAULT_PLAYBACK_STATE } })
  },

  seekTo: async (seconds) => {
    await getAudioPlayer().seekTo(seconds)
  },

  setSpeed: async (rate) => {
    set((s) => ({
      playback: { ...s.playback, playbackSpeed: rate },
    }))
    await getAudioPlayer().setSpeed(rate)
  },

  getCurrentEpisode: () => {
    const { episodes, playback } = get()
    if (!playback.currentEpisodeId) return null
    return episodes.find((e) => e.id === playback.currentEpisodeId) ?? null
  },
}))
