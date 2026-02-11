// SRS Algorithm Constants
export const DEFAULT_EASE = 250
export const MINIMUM_EASE = 130
export const FUZZ_FACTOR = 0.05

// Design Tokens
export const Colors = {
  primary: '#6C3CE1',
  accent: '#00E5FF',
  background: '#0D0D1A',
  surface: '#1A1A2E',
  surfaceLight: '#252542',
  text: '#E8E8F0',
  textSecondary: '#9A9AB0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F43F5E',
  border: '#2A2A4A',
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

// Settings Keys
export const SETTINGS_KEYS = {
  VAULT_PATH: 'vaultPath',
  DEFAULT_EASE: 'defaultEase',
  MINIMUM_EASE: 'minimumEase',
  FUZZ_ENABLED: 'fuzzEnabled',
  DAILY_NEW_LIMIT: 'dailyNewLimit',
} as const
