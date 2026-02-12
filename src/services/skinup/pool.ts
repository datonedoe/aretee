// Pool management service — deposit, drain, pause, resume (mocked backend)

import { Pool, PoolStatus, SkinUPConfig, DEFAULT_POOL, DrainEvent } from '../../types/skinup'

// Mock data store
let mockPool: Pool | null = null
let mockDrainEvents: DrainEvent[] = []

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export const PoolService = {
  async createPool(config: SkinUPConfig): Promise<Pool> {
    const now = new Date().toISOString()
    mockPool = {
      ...DEFAULT_POOL,
      id: generateId(),
      userId: 'mock-user-1',
      status: 'active',
      depositAmount: config.depositAmount * 100, // convert to cents
      currentBalance: config.depositAmount * 100,
      drainRate: config.drainRate,
      gracePeriodMinutes: config.gracePeriodMinutes,
      selectedOrgId: config.selectedOrgId,
      selectedOrgName: config.selectedOrgName,
      createdAt: now,
      activatedAt: now,
    }
    return { ...mockPool }
  },

  async getActivePool(): Promise<Pool | null> {
    if (!mockPool) return null
    return { ...mockPool }
  },

  async drainPool(amount: number, reason: DrainEvent['reason'] = 'timer'): Promise<DrainEvent | null> {
    if (!mockPool || mockPool.status !== 'active') return null

    const drainAmount = Math.min(amount, mockPool.currentBalance)
    if (drainAmount <= 0) return null

    mockPool.currentBalance -= drainAmount
    mockPool.drainedTotal += drainAmount

    const event: DrainEvent = {
      id: generateId(),
      poolId: mockPool.id,
      amount: drainAmount,
      timestamp: new Date().toISOString(),
      reason,
      donatedToOrg: mockPool.selectedOrgId,
    }
    mockDrainEvents.push(event)

    // Check if fully drained
    if (mockPool.currentBalance <= 0) {
      mockPool.status = 'drained'
      mockPool.currentBalance = 0
    }

    return event
  },

  async pausePool(): Promise<Pool | null> {
    if (!mockPool || mockPool.status !== 'active') return null
    if (mockPool.pauseCount >= mockPool.maxPauses) return null

    // Check cooldown
    if (mockPool.lastPauseEndAt) {
      const cooldownEnd = new Date(mockPool.lastPauseEndAt).getTime() +
        mockPool.pauseCooldownMinutes * 60 * 1000
      if (Date.now() < cooldownEnd) return null
    }

    mockPool.status = 'paused'
    mockPool.pausedAt = new Date().toISOString()
    mockPool.pauseCount += 1

    return { ...mockPool }
  },

  async resumePool(): Promise<Pool | null> {
    if (!mockPool || mockPool.status !== 'paused') return null

    mockPool.status = 'active'
    mockPool.lastPauseEndAt = new Date().toISOString()
    mockPool.pausedAt = null

    return { ...mockPool }
  },

  async completePool(): Promise<Pool | null> {
    if (!mockPool) return null

    mockPool.status = 'completed'
    mockPool.completedAt = new Date().toISOString()

    return { ...mockPool }
  },

  async getDrainEvents(poolId?: string): Promise<DrainEvent[]> {
    if (poolId) {
      return mockDrainEvents.filter(e => e.poolId === poolId)
    }
    return [...mockDrainEvents]
  },

  async resetPool(): Promise<void> {
    mockPool = null
    mockDrainEvents = []
  },

  // For testing — seed a mock pool
  async seedMockPool(overrides?: Partial<Pool>): Promise<Pool> {
    const now = new Date().toISOString()
    mockPool = {
      ...DEFAULT_POOL,
      id: generateId(),
      userId: 'mock-user-1',
      status: 'active',
      depositAmount: 2000, // $20
      currentBalance: 1750, // $17.50 remaining
      drainRate: 5,
      gracePeriodMinutes: 30,
      selectedOrgId: 'american-red-cross',
      selectedOrgName: 'American Red Cross',
      createdAt: now,
      activatedAt: now,
      drainedTotal: 250,
      ...overrides,
    }
    return { ...mockPool }
  },
}
