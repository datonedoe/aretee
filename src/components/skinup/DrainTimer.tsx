import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { DrainTimerState } from '../../types/skinup'

interface DrainTimerProps {
  state: DrainTimerState
  drainRate: number // cents per minute
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function DrainTimerComponent({ state, drainRate }: DrainTimerProps) {
  const drainPerMinute = (drainRate / 100).toFixed(2)
  const drainedToday = (state.totalDrainedToday / 100).toFixed(2)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {state.inGracePeriod ? '⏳ Grace Period' : '🔥 Drain Timer'}
        </Text>
        {state.isPaused && (
          <Text style={styles.pausedBadge}>PAUSED</Text>
        )}
      </View>

      <Text style={[
        styles.timer,
        state.inGracePeriod && styles.timerGrace,
        state.isPaused && styles.timerPaused,
      ]}>
        {state.inGracePeriod
          ? formatTime(state.graceSecondsRemaining)
          : formatTime(state.secondsUntilNextDrain)
        }
      </Text>

      <Text style={styles.subtitle}>
        {state.inGracePeriod
          ? 'until drain begins'
          : `next drain: -$${drainPerMinute}`
        }
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>${drainPerMinute}</Text>
          <Text style={styles.statLabel}>per min</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, parseFloat(drainedToday) > 0 && styles.statValueDrain]}>
            ${drainedToday}
          </Text>
          <Text style={styles.statLabel}>drained today</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  pausedBadge: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  timer: {
    color: '#F43F5E',
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerGrace: {
    color: '#10B981',
  },
  timerPaused: {
    color: '#F59E0B',
    opacity: 0.7,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#2D2D44',
  },
  statValue: {
    color: '#E8E8F0',
    fontSize: 18,
    fontWeight: '700',
  },
  statValueDrain: {
    color: '#F43F5E',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
})
