import { useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useDeckStore } from '../../src/stores/deckStore'
import { useProfileStore } from '../../src/stores/profileStore'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { XPBar, StreakFlame, DailyQuests, AchievementList } from '../../src/components/gamification'

export default function ProfileScreen() {
  const { decks } = useDeckStore()
  const { profile, streakData, isLoaded, loadProfile } = useProfileStore()

  useEffect(() => {
    if (!isLoaded) {
      loadProfile()
    }
  }, [isLoaded])

  const totalDecks = decks.length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          Profile
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.xs }}>
          Your learning journey
        </Text>

        {/* XP Bar */}
        <View style={{ marginTop: Spacing.lg }}>
          <XPBar />
        </View>

        {/* Streak + Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            gap: Spacing.md,
            marginTop: Spacing.md,
          }}
        >
          {/* Streak */}
          <View style={{ flex: 1 }}>
            <StreakFlame />
          </View>

          {/* Quick Stats */}
          <View style={{ flex: 1, gap: Spacing.md }}>
            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <Ionicons name="layers-outline" size={22} color={Colors.primary} />
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 20,
                  fontWeight: '700',
                  marginTop: 4,
                }}
              >
                {totalDecks}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>Decks</Text>
            </View>

            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <Ionicons name="documents-outline" size={22} color={Colors.accent} />
              <Text
                style={{
                  color: Colors.text,
                  fontSize: 20,
                  fontWeight: '700',
                  marginTop: 4,
                }}
              >
                {streakData.summary.totalReviews.toLocaleString()}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
                Reviews
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Quests */}
        <View style={{ marginTop: Spacing.md }}>
          <DailyQuests />
        </View>

        {/* Achievements */}
        <View style={{ marginTop: Spacing.md }}>
          <AchievementList />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
