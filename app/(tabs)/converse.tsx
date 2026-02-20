/**
 * Sprint 12: Converse tab — scenario picker hub.
 * Lists all conversation scenarios with characters, difficulty, and register info.
 */

import { useCallback, useMemo, useState } from 'react'
import { View, Text, FlatList, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { ScenarioCard } from '../../src/components/conversation/ScenarioCard'
import { getScenarios } from '../../src/services/ai/scenarios'
import { useConversationStore } from '../../src/stores/conversationStore'
import { hapticSelection } from '../../src/services/haptics'
import type { Scenario } from '../../src/types/conversation'

type FilterKey = 'all' | 'beginner' | 'intermediate' | 'advanced'

const FILTERS: { key: FilterKey; label: string; maxDifficulty: number }[] = [
  { key: 'all', label: 'All', maxDifficulty: 5 },
  { key: 'beginner', label: 'Beginner', maxDifficulty: 2 },
  { key: 'intermediate', label: 'Intermediate', maxDifficulty: 3 },
  { key: 'advanced', label: 'Advanced', maxDifficulty: 5 },
]

export default function ConverseScreen() {
  const router = useRouter()
  const { history } = useConversationStore()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const scenarios = useMemo(() => getScenarios(), [])

  const filteredScenarios = useMemo(() => {
    if (activeFilter === 'all') return scenarios
    const filter = FILTERS.find((f) => f.key === activeFilter)
    if (!filter) return scenarios
    if (activeFilter === 'advanced') {
      return scenarios.filter((s) => s.difficultyLevel >= 4)
    }
    return scenarios.filter((s) => s.difficultyLevel <= filter.maxDifficulty)
  }, [scenarios, activeFilter])

  const handleSelect = useCallback(
    (scenario: Scenario) => {
      router.push(`/conversation/${scenario.id}`)
    },
    [router]
  )

  const handleFilterPress = useCallback((key: FilterKey) => {
    hapticSelection()
    setActiveFilter(key)
  }, [])

  const completedCount = useMemo(() => {
    const uniqueScenarios = new Set(history.map((h) => h.scenarioId))
    return uniqueScenarios.size
  }, [history])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.text,
              fontSize: 28,
              fontWeight: '800',
            }}
          >
            Converse
          </Text>
          {completedCount > 0 && (
            <View
              style={{
                backgroundColor: Colors.primary + '20',
                borderRadius: BorderRadius.full,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={14}
                color={Colors.primary}
              />
              <Text
                style={{
                  color: Colors.primary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {completedCount}/{scenarios.length}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            marginTop: Spacing.xs,
            lineHeight: 20,
          }}
        >
          Practice real conversations with AI characters. They have opinions,
          they react to your tone, and they won't let you off easy.
        </Text>

        {/* Filter pills */}
        <View
          style={{
            flexDirection: 'row',
            gap: Spacing.sm,
            marginTop: Spacing.md,
            marginBottom: Spacing.sm,
          }}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key
            return (
              <Pressable
                key={filter.key}
                onPress={() => handleFilterPress(filter.key)}
                style={{
                  backgroundColor: isActive
                    ? Colors.primary
                    : Colors.surface,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.xs + 2,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  borderColor: isActive ? Colors.primary : Colors.border,
                }}
              >
                <Text
                  style={{
                    color: isActive ? '#fff' : Colors.textSecondary,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Scenario list */}
      <FlatList
        data={filteredScenarios}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <ScenarioCard scenario={item} onSelect={handleSelect} />
        )}
        ListEmptyComponent={
          <View
            style={{
              padding: Spacing.xl,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>
              No scenarios match this filter.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}
