/**
 * Sprint 12: Scenario selection card for the conversation hub.
 */

import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { Scenario } from '../../types/conversation'
import { hapticLight } from '../../services/haptics'

interface ScenarioCardProps {
  scenario: Scenario
  onSelect: (scenario: Scenario) => void
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor:
              i <= level ? Colors.primary : Colors.border,
          }}
        />
      ))}
    </View>
  )
}

function RegisterBadge({ register }: { register: string }) {
  const colorMap: Record<string, string> = {
    formal: Colors.accent,
    informal: Colors.success,
    street: Colors.warning,
    professional: '#8B5CF6',
  }
  const color = colorMap[register] ?? Colors.textSecondary

  return (
    <View
      style={{
        backgroundColor: color + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: color + '40',
      }}
    >
      <Text
        style={{
          color,
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {register}
      </Text>
    </View>
  )
}

export function ScenarioCard({ scenario, onSelect }: ScenarioCardProps) {
  const character = scenario.characters[0]

  return (
    <Pressable
      onPress={() => {
        hapticLight()
        onSelect(scenario)
      }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.surfaceLight : Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
      })}
    >
      {/* Top row: emoji + title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        }}
      >
        <Text style={{ fontSize: 28 }}>{scenario.settingEmoji}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: Colors.text,
              fontSize: 17,
              fontWeight: '700',
            }}
          >
            {scenario.title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 14 }}>
              {character?.avatarEmoji ?? '🗣️'}
            </Text>
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 13,
              }}
            >
              {character?.name ?? 'AI'}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text
        style={{
          color: Colors.textSecondary,
          fontSize: 14,
          lineHeight: 20,
          marginTop: Spacing.sm,
        }}
        numberOfLines={3}
      >
        {scenario.description}
      </Text>

      {/* Bottom row: difficulty, register, time */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: Spacing.md,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
        >
          <DifficultyDots level={scenario.difficultyLevel} />
          <RegisterBadge register={scenario.targetRegister} />
        </View>

        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
            ~{scenario.estimatedMinutes} min
          </Text>
        </View>
      </View>
    </Pressable>
  )
}
