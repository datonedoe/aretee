import { useEffect, useState, useCallback } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ReviewResponse, ResponseColors, AchievementDefinition } from '../src/types'
import { useReviewStore } from '../src/stores/reviewStore'
import { useProfileStore } from '../src/stores/profileStore'
import { useDeckStore } from '../src/stores/deckStore'
import { Colors, Spacing, BorderRadius } from '../src/utils/constants'
import { XPBar } from '../src/components/gamification'
import { LevelUpCelebration } from '../src/components/gamification/LevelUpCelebration'
import { AchievementToast } from '../src/components/gamification/AchievementToast'
import { playSound } from '../src/services/audio/sounds'

interface SessionSummary {
  deckName: string
  totalCards: number
  again: number
  hard: number
  good: number
  easy: number
  duration: number
  xpEarned: number
}

export default function ResultsScreen() {
  const router = useRouter()
  const endSession = useReviewStore((s) => s.endSession)
  const sessionXP = useProfileStore((s) => s.sessionXP)
  const consumeEvents = useProfileStore((s) => s.consumeEvents)
  const onSessionEnd = useProfileStore((s) => s.onSessionEnd)
  const onDeckCompleted = useProfileStore((s) => s.onDeckCompleted)
  const { decks } = useDeckStore()

  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null)
  const [achievementQueue, setAchievementQueue] = useState<AchievementDefinition[]>([])
  const [currentAchievement, setCurrentAchievement] = useState<AchievementDefinition | null>(null)

  useEffect(() => {
    const session = endSession()
    if (!session) {
      return
    }

    const counts = { again: 0, hard: 0, good: 0, easy: 0 }
    for (const r of session.results) {
      switch (r.response) {
        case ReviewResponse.Again: counts.again++; break
        case ReviewResponse.Hard: counts.hard++; break
        case ReviewResponse.Good: counts.good++; break
        case ReviewResponse.Easy: counts.easy++; break
      }
    }

    const duration = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000
    )

    const accuracy =
      session.results.length > 0
        ? Math.round(
            ((counts.good + counts.easy) / session.results.length) * 100
          )
        : 0

    const xpSnapshot = sessionXP

    setSummary({
      deckName: session.deckName,
      totalCards: session.results.length,
      ...counts,
      duration,
      xpEarned: xpSnapshot,
    })

    // Award deck completion XP
    onDeckCompleted()

    // Check for level-ups from card reviews
    const events = consumeEvents()
    for (const e of events) {
      if (e.leveledUp && e.newLevel) {
        setLevelUpLevel(e.newLevel)
        playSound('levelUp')
        break
      }
    }

    // Trigger session-end gamification (achievements, perfect day)
    onSessionEnd(
      session.results.length,
      duration,
      accuracy,
      decks.length
    ).then((event) => {
      if (event.newAchievements.length > 0) {
        setAchievementQueue(event.newAchievements)
        playSound('achievement')
      }
      if (event.leveledUp && event.newLevel) {
        setLevelUpLevel(event.newLevel)
        playSound('levelUp')
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show achievements one at a time
  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      setCurrentAchievement(achievementQueue[0])
      setAchievementQueue((q) => q.slice(1))
    }
  }, [achievementQueue, currentAchievement])

  const dismissAchievement = useCallback(() => {
    setCurrentAchievement(null)
  }, [])

  const dismissLevelUp = useCallback(() => {
    setLevelUpLevel(null)
  }, [])

  if (!summary) {
    // No recent review session - show friendly message
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: Spacing.xl,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              maxWidth: 400,
            }}
          >
            <Ionicons name="document-text-outline" size={48} color={Colors.textSecondary} />
            <Text
              style={{
                color: Colors.text,
                fontSize: 18,
                fontWeight: '600',
                textAlign: 'center',
                marginTop: Spacing.md,
              }}
            >
              No Recent Review Session
            </Text>
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                marginTop: Spacing.sm,
                lineHeight: 20,
              }}
            >
              Complete a review session to see your results here.
            </Text>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={{
                backgroundColor: Colors.primary,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                borderRadius: BorderRadius.md,
                marginTop: Spacing.lg,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                Go to Decks
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const accuracy =
    summary.totalCards > 0
      ? Math.round(((summary.good + summary.easy) / summary.totalCards) * 100)
      : 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Achievement toast */}
      {currentAchievement && (
        <AchievementToast
          achievement={currentAchievement}
          onDismiss={dismissAchievement}
        />
      )}

      {/* Level up celebration */}
      {levelUpLevel && (
        <LevelUpCelebration
          newLevel={levelUpLevel}
          onDismiss={dismissLevelUp}
        />
      )}

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          alignItems: 'center',
          paddingTop: Spacing.xxl,
        }}
      >
        {/* Completion Icon */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: Colors.success + '20',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
        </View>

        <Text
          style={{
            color: Colors.text,
            fontSize: 24,
            fontWeight: '800',
            marginTop: Spacing.lg,
          }}
        >
          Session Complete!
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            marginTop: Spacing.xs,
          }}
        >
          {summary.deckName}
        </Text>

        {/* XP Earned */}
        <View
          style={{
            backgroundColor: Colors.primary + '20',
            borderRadius: BorderRadius.lg,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            marginTop: Spacing.lg,
            borderWidth: 1,
            borderColor: Colors.primary + '40',
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
          }}
        >
          <Ionicons name="star" size={24} color={Colors.accent} />
          <Text style={{ color: Colors.accent, fontSize: 24, fontWeight: '800' }}>
            +{summary.xpEarned} XP
          </Text>
        </View>

        {/* XP Bar */}
        <View style={{ width: '100%', marginTop: Spacing.md }}>
          <XPBar compact />
        </View>

        {/* Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            gap: Spacing.md,
            marginTop: Spacing.lg,
            width: '100%',
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ color: Colors.accent, fontSize: 28, fontWeight: '700' }}>
              {summary.totalCards}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Cards
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ color: Colors.success, fontSize: 28, fontWeight: '700' }}>
              {accuracy}%
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Accuracy
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ color: Colors.primary, fontSize: 28, fontWeight: '700' }}>
              {formatDuration(summary.duration)}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Time
            </Text>
          </View>
        </View>

        {/* Response Breakdown */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            marginTop: Spacing.lg,
            width: '100%',
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text
            style={{
              color: Colors.text,
              fontSize: 15,
              fontWeight: '600',
              marginBottom: Spacing.md,
            }}
          >
            Response Breakdown
          </Text>

          {([
            { label: 'Again', count: summary.again, response: ReviewResponse.Again },
            { label: 'Hard', count: summary.hard, response: ReviewResponse.Hard },
            { label: 'Good', count: summary.good, response: ReviewResponse.Good },
            { label: 'Easy', count: summary.easy, response: ReviewResponse.Easy },
          ] as const).map(({ label, count, response }) => {
            const pct = summary.totalCards > 0 ? (count / summary.totalCards) * 100 : 0
            const color = ResponseColors[response]
            return (
              <View key={label} style={{ marginBottom: Spacing.sm }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ color, fontSize: 13, fontWeight: '600' }}>{label}</Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>{count}</Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: Colors.surfaceLight,
                    borderRadius: BorderRadius.full,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: color,
                      borderRadius: BorderRadius.full,
                    }}
                  />
                </View>
              </View>
            )
          })}
        </View>

        {/* Action Buttons */}
        <View style={{ width: '100%', gap: Spacing.sm, marginTop: Spacing.xl }}>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Back to Decks
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
