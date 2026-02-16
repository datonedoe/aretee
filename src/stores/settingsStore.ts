import { create } from 'zustand'
import { getStorageService } from '../services/platform'
import { isDemoMode } from '../utils/demo-data'
import {
  SETTINGS_KEYS,
  DEFAULT_DESIRED_RETENTION,
  MIN_DESIRED_RETENTION,
  MAX_DESIRED_RETENTION,
} from '../utils/constants'

interface SettingsState {
  vaultPath: string | null
  fuzzEnabled: boolean
  dailyNewLimit: number
  desiredRetention: number
  isLoaded: boolean

  loadSettings: () => Promise<void>
  setVaultPath: (path: string | null) => Promise<void>
  setFuzzEnabled: (enabled: boolean) => Promise<void>
  setDailyNewLimit: (limit: number) => Promise<void>
  setDesiredRetention: (retention: number) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  vaultPath: null,
  fuzzEnabled: true,
  dailyNewLimit: 20,
  desiredRetention: DEFAULT_DESIRED_RETENTION,
  isLoaded: false,

  loadSettings: async () => {
    // Demo mode bypass
    if (isDemoMode()) {
      set({ vaultPath: '/demo', fuzzEnabled: true, dailyNewLimit: 20, desiredRetention: 0.9, isLoaded: true })
      return
    }
    const storage = getStorageService()
    const vaultPath = await storage.get<string>(SETTINGS_KEYS.VAULT_PATH)
    const fuzzEnabled = await storage.get<boolean>(SETTINGS_KEYS.FUZZ_ENABLED)
    const dailyNewLimit = await storage.get<number>(SETTINGS_KEYS.DAILY_NEW_LIMIT)
    const desiredRetention = await storage.get<number>(SETTINGS_KEYS.DESIRED_RETENTION)

    set({
      vaultPath: vaultPath ?? null,
      fuzzEnabled: fuzzEnabled ?? true,
      dailyNewLimit: dailyNewLimit ?? 20,
      desiredRetention: desiredRetention ?? DEFAULT_DESIRED_RETENTION,
      isLoaded: true,
    })
  },

  setVaultPath: async (path) => {
    const storage = getStorageService()
    if (path) {
      await storage.set(SETTINGS_KEYS.VAULT_PATH, path)
    } else {
      await storage.delete(SETTINGS_KEYS.VAULT_PATH)
    }
    set({ vaultPath: path })
  },

  setFuzzEnabled: async (enabled) => {
    const storage = getStorageService()
    await storage.set(SETTINGS_KEYS.FUZZ_ENABLED, enabled)
    set({ fuzzEnabled: enabled })
  },

  setDailyNewLimit: async (limit) => {
    const storage = getStorageService()
    await storage.set(SETTINGS_KEYS.DAILY_NEW_LIMIT, limit)
    set({ dailyNewLimit: limit })
  },

  setDesiredRetention: async (retention) => {
    const clamped = Math.min(
      MAX_DESIRED_RETENTION,
      Math.max(MIN_DESIRED_RETENTION, retention)
    )
    const storage = getStorageService()
    await storage.set(SETTINGS_KEYS.DESIRED_RETENTION, clamped)
    set({ desiredRetention: clamped })
  },
}))
