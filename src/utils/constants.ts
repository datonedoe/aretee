// SRS Algorithm Constants (legacy SM-2)
export const DEFAULT_EASE = 250
export const MINIMUM_EASE = 130
export const FUZZ_FACTOR = 0.05

// FSRS-5 default parameters (w[0..18])
export const FSRS_PARAMS: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105, // w[0-3]: initial stability per rating
  7.1949,  // w[4]: initial difficulty offset
  0.5345,  // w[5]: initial difficulty slope
  1.4604,  // w[6]: difficulty update rate
  0.0046,  // w[7]: mean reversion weight
  1.54575, // w[8]: recall stability increase base
  0.1192,  // w[9]: recall stability S exponent
  1.01925, // w[10]: recall stability R factor
  1.9395,  // w[11]: forget stability D coeff
  0.11,    // w[12]: forget stability D exponent
  0.29605, // w[13]: forget stability S exponent
  2.2698,  // w[14]: forget stability R factor
  0.2315,  // w[15]: hard penalty
  2.9898,  // w[16]: easy bonus
  0.51655, // w[17]: short-term stability rate
  0.6621,  // w[18]: short-term stability offset
] as const

// FSRS retention target
export const DEFAULT_DESIRED_RETENTION = 0.9
export const MIN_DESIRED_RETENTION = 0.7
export const MAX_DESIRED_RETENTION = 0.97

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
  DESIRED_RETENTION: 'desiredRetention',
} as const
