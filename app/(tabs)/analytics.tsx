import { useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useDeckStore } from '../../src/stores/deckStore'
import { useErrorStore } from '../../src/stores/errorStore'
import { ReviewAnalytics } from '../../src/components/analytics/ReviewAnalytics'
import { ErrorPatterns } from '../../src/components/analytics/ErrorPatterns'
import { Colors, Spacing } from '../../src/utils/constants'

export default function AnalyticsScreen() {
  const router = useRouter()
  const { decks } = useDeckStore()
  const { profile, loadProfile } = useErrorStore()
  const allCards = decks.flatMap((d) => d.cards)

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          Analytics
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs }}>
          {allCards.length} cards across {decks.length} decks
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        <ReviewAnalytics cards={allCards} />
        {/* Error Patterns (Sprint 9) */}
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
          <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: Spacing.md }}>
            🎯 Error Patterns
          </Text>
          <ErrorPatterns
            patterns={profile?.patterns ?? []}
            errorRate={profile?.errorRate ?? 0}
            totalErrors={profile?.totalErrors ?? 0}
            onPracticeWeakAreas={() => router.push('/review/blended')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
