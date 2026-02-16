import { View, Text, StyleSheet } from 'react-native'
import { SessionSegment, SessionSegmentMode } from '../../types/interleaving'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

const MODE_CONFIG: Record<
  SessionSegmentMode,
  { label: string; emoji: string; color: string; description: string }
> = {
  [SessionSegmentMode.Flash]: {
    label: 'Flash',
    emoji: '⚡',
    color: Colors.primary,
    description: 'Quick recall',
  },
  [SessionSegmentMode.Socratic]: {
    label: 'Socratic',
    emoji: '🏛️',
    color: Colors.accent,
    description: 'Guided dialogue',
  },
  [SessionSegmentMode.Feynman]: {
    label: 'Feynman',
    emoji: '🧠',
    color: Colors.warning,
    description: 'Explain to learn',
  },
}

interface SessionModeIndicatorProps {
  segment: SessionSegment
  progress: { current: number; total: number }
}

export function SessionModeIndicator({
  segment,
  progress,
}: SessionModeIndicatorProps) {
  const config = MODE_CONFIG[segment.mode]

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((progress.current + 1) / progress.total) * 100}%`,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>

      {/* Mode badge */}
      <View style={styles.row}>
        <View style={[styles.badge, { borderColor: config.color + '60' }]}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={[styles.label, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        <Text style={styles.progressText}>
          {progress.current + 1} / {progress.total}
        </Text>
      </View>

      {/* Reason */}
      <Text style={styles.reason}>{segment.reason}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  reason: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
})
