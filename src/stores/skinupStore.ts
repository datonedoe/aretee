import { create } from 'zustand'
import { Pool, DrainTimerState, SkinUPConfig, EveryOrgOrganization, DrainEvent } from '../types/skinup'
import { PoolService } from '../services/skinup/pool'
import { drainTimer } from '../services/skinup/drain'
import { DonationService } from '../services/skinup/donations'

interface SkinUPStore {
  // Pool state
  pool: Pool | null
  isLoading: boolean
  error: string | null

  // Drain timer
  drainState: DrainTimerState

  // Org search
  searchResults: EveryOrgOrganization[]
  isSearching: boolean

  // Drain history
  drainEvents: DrainEvent[]

  // Actions
  loadPool: () => Promise<void>
  createPool: (config: SkinUPConfig) => Promise<boolean>
  pausePool: () => Promise<boolean>
  resumePool: () => Promise<boolean>
  resetPool: () => Promise<void>
  searchOrgs: (query: string) => Promise<void>
  loadDrainEvents: () => Promise<void>
  startDrain: () => void
  stopDrain: () => void
  onStudyComplete: () => Promise<void>

  // For demo
  seedDemo: () => Promise<void>
}

export const useSkinUPStore = create<SkinUPStore>((set, get) => {
  // Wire up drain timer updates
  drainTimer.setOnUpdate((drainState) => {
    set({ drainState })
    // Also refresh pool balance on each tick
    PoolService.getActivePool().then(pool => {
      if (pool) set({ pool })
    })
  })

  return {
    pool: null,
    isLoading: false,
    error: null,
    drainState: drainTimer.getState(),
    searchResults: [],
    isSearching: false,
    drainEvents: [],

    loadPool: async () => {
      set({ isLoading: true, error: null })
      try {
        const pool = await PoolService.getActivePool()
        set({ pool, isLoading: false })
      } catch (e: any) {
        set({ error: e.message, isLoading: false })
      }
    },

    createPool: async (config) => {
      set({ isLoading: true, error: null })
      try {
        const pool = await PoolService.createPool(config)
        set({ pool, isLoading: false })
        // Start drain with grace period
        drainTimer.start(config.gracePeriodMinutes)
        return true
      } catch (e: any) {
        set({ error: e.message, isLoading: false })
        return false
      }
    },

    pausePool: async () => {
      try {
        const pool = await PoolService.pausePool()
        if (!pool) {
          set({ error: 'Cannot pause — limit reached or cooldown active' })
          return false
        }
        drainTimer.pause()
        set({ pool, error: null })
        return true
      } catch (e: any) {
        set({ error: e.message })
        return false
      }
    },

    resumePool: async () => {
      try {
        const pool = await PoolService.resumePool()
        if (!pool) return false
        drainTimer.resume()
        set({ pool, error: null })
        return true
      } catch (e: any) {
        set({ error: e.message })
        return false
      }
    },

    resetPool: async () => {
      drainTimer.reset()
      await PoolService.resetPool()
      set({ pool: null, drainEvents: [], error: null })
    },

    searchOrgs: async (query) => {
      set({ isSearching: true })
      try {
        const searchResults = await DonationService.searchOrgs(query)
        set({ searchResults, isSearching: false })
      } catch {
        set({ isSearching: false })
      }
    },

    loadDrainEvents: async () => {
      const pool = get().pool
      if (!pool) return
      const drainEvents = await PoolService.getDrainEvents(pool.id)
      set({ drainEvents })
    },

    startDrain: () => {
      const pool = get().pool
      if (pool) {
        drainTimer.start(pool.gracePeriodMinutes)
      }
    },

    stopDrain: () => {
      drainTimer.stop()
    },

    onStudyComplete: async () => {
      await drainTimer.onStudyComplete()
    },

    seedDemo: async () => {
      const pool = await PoolService.seedMockPool()
      set({ pool })
      drainTimer.start(0) // no grace for demo
    },
  }
})
