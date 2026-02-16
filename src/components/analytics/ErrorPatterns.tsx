import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ErrorPattern, ErrorCategory } from '../../types/errors'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  [ErrorCategory.L1Interference]: 'L1 Interference',
  [ErrorCategory.FalseFriend]: 'False Friends',
  [ErrorCategory.Overgeneralization]: 'Overgeneralization',
  [ErrorCategory.RegisterMismatch]: 'Register Mismatch',
  [ErrorCategory.Avoidance]: 'Avoidance',
  [ErrorCategory.PlainForgetting]: 'Forgetting',
  [ErrorCategory.ConceptualGap]: 'Conceptual Gap',
  [ErrorCategory.PartialRecall]: 'Partial Recall',
}

const CATEGORY_EMOJI: Record<ErrorCategory, string> = {
  [ErrorCategory.L1Interference]: '🔀',
  [ErrorCategory.FalseFriend]: '🪤',
  [ErrorCategory.Overgeneralization]: '🔄',
  [ErrorCategory.RegisterMismatch]: '🎭',
  [ErrorCategory.Avoidance]: '🚫',
  [ErrorCategory.PlainForgetting]: '🧠',
  [ErrorCategory.ConceptualGap]: '❓',
  [ErrorCategory.PartialRecall]: '🧩',
}

const TREND_ARROWS: Record<string, { symbol: string; color: string }> = {
  improving: { symbol: '↓', color: Colors.success },
  stable: { symbol: '→', color: Colors.textSecondary },
  worsening: { symbol: '↑', color: Colors.error },
}

interface ErrorPatternsProps {
  patterns: ErrorPattern[]
  errorRate: number
  totalErrors: number
  onPracticeWeakAreas?: () => void
}

export function ErrorPatterns({
  patterns,
  errorRate,
  totalErrors,
  onPracticeWeakAreas,
}: ErrorPatternsProps) {
  const topPatterns = patterns.slice(0, 5)

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalErrors}</Text>
          <Text style={styles.statLabel}>Total Errors</Text>
        </View>
        <View style={styles.statBox}>
          <Text
            style={[
              styles.statValue,
              { color: errorRate > 0.3 ? Colors.error : errorRate > 0.15 ? Colors.warning : Colors.success },
            ]}
          >
            {Math.round(errorRate * 100)}%
          </Text>
          <Text style={styles.statLabel}>Error Rate</Text>
        </View>
      </View>

      {/* Pattern List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Error Patterns</Text>
        {topPatterns.length === 0 ? (
          <Text style={styles.emptyText}>
            No error patterns yet. Keep reviewing to build your profile.
          </Text>
        ) : (
          topPatterns.map((pattern, index) => {
            const trend = TREND_ARROWS[pattern.trend]
            return (
              <View key={`${pattern.category}-${pattern.subcategory ?? index}`} style={styles.patternRow}>
                <Text style={styles.patternEmoji}>
                  {CATEGORY_EMOJI[pattern.category]}
                </Text>
                <View style={styles.patternInfo}>
                  <Text style={styles.patternName}>
                    {CATEGORY_LABELS[pattern.category]}
                    {pattern.subcategory ? ` (${pattern.subcategory})` : ''}
                  </Text>
                  <Text style={styles.patternMeta}>
                    {pattern.count} occurrences · {pattern.relatedCardIds.length} cards
                  </Text>
                </View>
                <View style={styles.trendContainer}>
                  <Text style={[styles.trendArrow, { color: trend.color }]}>
                    {trend.symbol}
                  </Text>
                  <Text style={[styles.trendLabel, { color: trend.color }]}>
                    {pattern.trend}
                  </Text>
                </View>
              </View>
            )
          })
        )}
      </View>

      {/* Practice Button */}
      {topPatterns.length > 0 && onPracticeWeakAreas && (
        <TouchableOpacity style={styles.practiceButton} onPress={onPracticeWeakAreas}>
          <Text style={styles.practiceButtonText}>🎯 Practice Weak Areas</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  patternEmoji: {
    fontSize: 20,
    width: 28,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  patternMeta: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  trendContainer: {
    alignItems: 'center',
    width: 60,
  },
  trendArrow: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendLabel: {
    fontSize: 9,
    marginTop: 1,
  },
  practiceButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  practiceButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
})
