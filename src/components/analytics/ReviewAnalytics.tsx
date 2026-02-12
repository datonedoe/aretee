import { View, Text, ScrollView } from 'react-native'
import { Card, CardState, isCardDue } from '../../types'
import { SRSEngine } from '../../services/srs/engine'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { differenceInDays, addDays, format } from 'date-fns'

interface ReviewAnalyticsProps {
  cards: Card[]
}

export function ReviewAnalytics({ cards }: ReviewAnalyticsProps) {
  const now = new Date()

  // --- Daily Review Forecast (next 14 days) ---
  const forecast: { date: string; count: number }[] = []
  for (let i = 0; i < 14; i++) {
    const targetDate = addDays(now, i)
    const count = cards.filter((card) => {
      const reviewDate = new Date(card.nextReviewDate)
      return (
        differenceInDays(reviewDate, targetDate) === 0 ||
        (i === 0 && reviewDate <= targetDate)
      )
    }).length
    forecast.push({
      date: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(targetDate, 'MMM d'),
      count,
    })
  }
  const maxForecast = Math.max(1, ...forecast.map((f) => f.count))

  // --- Retention Rate ---
  const reviewedCards = cards.filter((c) => c.reps > 0)
  const avgRetention =
    reviewedCards.length > 0
      ? reviewedCards.reduce((sum, c) => {
          if (c.stability <= 0 || c.last_review == null) return sum
          const elapsed = Math.max(
            0,
            (now.getTime() - new Date(c.last_review).getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + SRSEngine.retrievability(elapsed, c.stability)
        }, 0) / reviewedCards.length
      : 0

  // --- Card Maturity Distribution ---
  const maturity = {
    [CardState.New]: 0,
    [CardState.Learning]: 0,
    [CardState.Review]: 0,
    [CardState.Relearning]: 0,
  }
  for (const card of cards) {
    maturity[card.state] = (maturity[card.state] || 0) + 1
  }
  const maturityLabels: Record<number, string> = {
    [CardState.New]: 'New',
    [CardState.Learning]: 'Learning',
    [CardState.Review]: 'Mature',
    [CardState.Relearning]: 'Relearning',
  }
  const maturityColors: Record<number, string> = {
    [CardState.New]: Colors.textSecondary,
    [CardState.Learning]: Colors.warning,
    [CardState.Review]: Colors.success,
    [CardState.Relearning]: Colors.error,
  }
  const totalCards = cards.length || 1

  // --- Lapse stats ---
  const totalLapses = cards.reduce((sum, c) => sum + c.lapses, 0)
  const dueNow = cards.filter(isCardDue).length

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
    >
      {/* Summary stats */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <StatCard label="Due Now" value={String(dueNow)} color={Colors.primary} />
        <StatCard
          label="Avg Retention"
          value={`${Math.round(avgRetention * 100)}%`}
          color={avgRetention > 0.85 ? Colors.success : avgRetention > 0.7 ? Colors.warning : Colors.error}
        />
        <StatCard label="Total Lapses" value={String(totalLapses)} color={Colors.error} />
      </View>

      {/* Daily Forecast */}
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md }}>
          14-Day Review Forecast
        </Text>
        {forecast.map((day) => (
          <View
            key={day.date}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 6,
              gap: Spacing.sm,
            }}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 12, width: 70 }}>
              {day.date}
            </Text>
            <View
              style={{
                flex: 1,
                height: 16,
                backgroundColor: Colors.surfaceLight,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${(day.count / maxForecast) * 100}%`,
                  backgroundColor: Colors.primary,
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ color: Colors.text, fontSize: 12, width: 30, textAlign: 'right' }}>
              {day.count}
            </Text>
          </View>
        ))}
      </View>

      {/* Card Maturity Distribution */}
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: Spacing.md }}>
          Card Maturity
        </Text>
        {Object.entries(maturity).map(([stateStr, count]) => {
          const state = Number(stateStr)
          const pct = (count / totalCards) * 100
          return (
            <View key={stateStr} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: maturityColors[state], fontSize: 13, fontWeight: '600' }}>
                  {maturityLabels[state]}
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                  {count} ({Math.round(pct)}%)
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: Colors.surfaceLight,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: maturityColors[state],
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: color + '30',
      }}
    >
      <Text style={{ color, fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: Colors.textSecondary, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  )
}
