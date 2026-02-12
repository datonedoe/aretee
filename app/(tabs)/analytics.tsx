import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDeckStore } from '../../src/stores/deckStore'
import { ReviewAnalytics } from '../../src/components/analytics/ReviewAnalytics'
import { Colors, Spacing } from '../../src/utils/constants'

export default function AnalyticsScreen() {
  const { decks } = useDeckStore()
  const allCards = decks.flatMap((d) => d.cards)

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
      <ReviewAnalytics cards={allCards} />
    </SafeAreaView>
  )
}
