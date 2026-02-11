import { create } from 'zustand'
import { getStorageService } from '../services/platform'
import { SETTINGS_KEYS } from '../utils/constants'

interface SettingsState {
  vaultPath: string | null
  fuzzEnabled: boolean
  dailyNewLimit: number
  isLoaded: boolean

  loadSettings: () => Promise<void>
  setVaultPath: (path: string | null) => Promise<void>
  setFuzzEnabled: (enabled: boolean) => Promise<void>
  setDailyNewLimit: (limit: number) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  vaultPath: null,
  fuzzEnabled: true,
  dailyNewLimit: 20,
  isLoaded: false,

  loadSettings: async () => {
    const storage = getStorageService()
    const vaultPath = await storage.get<string>(SETTINGS_KEYS.VAULT_PATH)
    const fuzzEnabled = await storage.get<boolean>(SETTINGS_KEYS.FUZZ_ENABLED)
    const dailyNewLimit = await storage.get<number>(SETTINGS_KEYS.DAILY_NEW_LIMIT)

    set({
      vaultPath: vaultPath ?? null,
      fuzzEnabled: fuzzEnabled ?? true,
      dailyNewLimit: dailyNewLimit ?? 20,
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
}))
