// SkinUP Types — Money accountability system

export type PoolStatus = 'inactive' | 'active' | 'paused' | 'drained' | 'completed'
export type DrainSpeed = 'slow' | 'medium' | 'fast' | 'brutal'

export interface SkinUPConfig {
  depositAmount: number        // USD amount deposited
  drainRate: number            // cents per minute when draining
  gracePeriodMinutes: number   // grace period before drain starts
  selectedOrgId: string        // Every.org org slug
  selectedOrgName: string      // Display name
  drainSpeed: DrainSpeed       // preset speed
}

export interface Pool {
  id: string
  userId: string
  status: PoolStatus
  depositAmount: number        // original deposit in cents
  currentBalance: number       // remaining balance in cents
  drainRate: number            // cents per minute
  gracePeriodMinutes: number
  selectedOrgId: string
  selectedOrgName: string
  createdAt: string            // ISO timestamp
  activatedAt: string | null
  pausedAt: string | null
  pauseCount: number
  maxPauses: number            // typically 3 per pool
  pauseCooldownMinutes: number // time before can pause again
  lastPauseEndAt: string | null
  drainedTotal: number         // total cents drained so far
  completedAt: string | null
}

export interface DrainEvent {
  id: string
  poolId: string
  amount: number               // cents drained
  timestamp: string
  reason: 'timer' | 'missed_review' | 'manual'
  donatedToOrg: string
}

export interface DrainTimerState {
  isRunning: boolean
  isPaused: boolean
  secondsUntilNextDrain: number
  graceSecondsRemaining: number
  inGracePeriod: boolean
  totalDrainedToday: number
}

export interface EveryOrgOrganization {
  slug: string
  name: string
  description: string
  logoUrl: string | null
  coverImageUrl: string | null
  ein: string | null           // tax ID
  category: string
  location: string | null
  websiteUrl: string | null
}

export interface DonationResult {
  success: boolean
  amount: number               // cents
  orgSlug: string
  orgName: string
  timestamp: string
  receiptUrl: string | null
}

export const DRAIN_SPEED_PRESETS: Record<DrainSpeed, { rate: number; label: string; description: string }> = {
  slow: { rate: 1, label: 'Slow Burn', description: '$0.01/min — gentle nudge' },
  medium: { rate: 5, label: 'Steady Drain', description: '$0.05/min — real stakes' },
  fast: { rate: 10, label: 'Fast Drain', description: '$0.10/min — serious pressure' },
  brutal: { rate: 25, label: 'Brutal', description: '$0.25/min — no mercy' },
}

export const DEFAULT_POOL: Pool = {
  id: '',
  userId: '',
  status: 'inactive',
  depositAmount: 0,
  currentBalance: 0,
  drainRate: 5,
  gracePeriodMinutes: 30,
  selectedOrgId: '',
  selectedOrgName: '',
  createdAt: '',
  activatedAt: null,
  pausedAt: null,
  pauseCount: 0,
  maxPauses: 3,
  pauseCooldownMinutes: 60,
  lastPauseEndAt: null,
  drainedTotal: 0,
  completedAt: null,
}
