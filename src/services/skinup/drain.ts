// Drain timer logic — manages countdown and periodic draining

import { DrainTimerState } from '../../types/skinup'
import { PoolService } from './pool'

type DrainCallback = (state: DrainTimerState) => void

class DrainTimer {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private state: DrainTimerState = {
    isRunning: false,
    isPaused: false,
    secondsUntilNextDrain: 60,
    graceSecondsRemaining: 0,
    inGracePeriod: false,
    totalDrainedToday: 0,
  }
  private drainIntervalSeconds = 60 // drain every 60 seconds
  private onUpdate: DrainCallback | null = null

  getState(): DrainTimerState {
    return { ...this.state }
  }

  setOnUpdate(callback: DrainCallback | null) {
    this.onUpdate = callback
  }

  private notify() {
    this.onUpdate?.(this.getState())
  }

  async start(gracePeriodMinutes: number = 0) {
    if (this.state.isRunning) return

    this.state.isRunning = true
    this.state.isPaused = false

    if (gracePeriodMinutes > 0) {
      this.state.inGracePeriod = true
      this.state.graceSecondsRemaining = gracePeriodMinutes * 60
    } else {
      this.state.inGracePeriod = false
      this.state.graceSecondsRemaining = 0
    }

    this.state.secondsUntilNextDrain = this.drainIntervalSeconds
    this.notify()

    this.intervalId = setInterval(() => this.tick(), 1000)
  }

  private async tick() {
    if (this.state.isPaused) return

    // Handle grace period
    if (this.state.inGracePeriod) {
      this.state.graceSecondsRemaining -= 1
      if (this.state.graceSecondsRemaining <= 0) {
        this.state.inGracePeriod = false
        this.state.graceSecondsRemaining = 0
        this.state.secondsUntilNextDrain = this.drainIntervalSeconds
      }
      this.notify()
      return
    }

    // Countdown to next drain
    this.state.secondsUntilNextDrain -= 1

    if (this.state.secondsUntilNextDrain <= 0) {
      await this.executeDrain()
      this.state.secondsUntilNextDrain = this.drainIntervalSeconds
    }

    this.notify()
  }

  private async executeDrain() {
    const pool = await PoolService.getActivePool()
    if (!pool || pool.status !== 'active') {
      this.stop()
      return
    }

    const event = await PoolService.drainPool(pool.drainRate, 'timer')
    if (event) {
      this.state.totalDrainedToday += event.amount
    }

    // Check if pool is fully drained
    const updatedPool = await PoolService.getActivePool()
    if (updatedPool && updatedPool.currentBalance <= 0) {
      this.stop()
    }
  }

  pause() {
    if (!this.state.isRunning) return
    this.state.isPaused = true
    this.notify()
  }

  resume() {
    if (!this.state.isRunning) return
    this.state.isPaused = false
    this.notify()
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.state.isRunning = false
    this.state.isPaused = false
    this.notify()
  }

  reset() {
    this.stop()
    this.state = {
      isRunning: false,
      isPaused: false,
      secondsUntilNextDrain: 60,
      graceSecondsRemaining: 0,
      inGracePeriod: false,
      totalDrainedToday: 0,
    }
    this.notify()
  }

  // Study session completed — pause drain as reward
  async onStudyComplete() {
    if (this.state.isRunning && !this.state.isPaused) {
      // Grant a grace period as reward for studying
      this.state.inGracePeriod = true
      this.state.graceSecondsRemaining = 30 * 60 // 30 min grace
      this.notify()
    }
  }
}

// Singleton
export const drainTimer = new DrainTimer()
