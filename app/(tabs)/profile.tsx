import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useDeckStore } from '../../src/stores/deckStore'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'

export default function ProfileScreen() {
  const { decks } = useDeckStore()

  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0)
  const totalDecks = decks.length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: Spacing.lg }}>
        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          Profile
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs }}>
          Your learning stats
        </Text>
      </View>

      <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
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
            <Ionicons name="layers-outline" size={28} color={Colors.primary} />
            <Text style={{ color: Colors.text, fontSize: 24, fontWeight: '700', marginTop: Spacing.sm }}>
              {totalDecks}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Decks</Text>
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
            <Ionicons name="copy-outline" size={28} color={Colors.accent} />
            <Text style={{ color: Colors.text, fontSize: 24, fontWeight: '700', marginTop: Spacing.sm }}>
              {totalCards}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Cards</Text>
          </View>
        </View>

        {/* Coming Soon */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.xl,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Colors.border,
            marginTop: Spacing.md,
          }}
        >
          <Ionicons name="trending-up-outline" size={40} color={Colors.textSecondary} />
          <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '600', marginTop: Spacing.md }}>
            Gamification Coming Soon
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 13,
              marginTop: Spacing.sm,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            XP, levels, streaks, and achievements will be available in Sprint 2.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
