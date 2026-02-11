import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { useProfileStore } from '../../stores/profileStore'
import { ACHIEVEMENT_DEFINITIONS } from '../../services/gamification'
import { RARITY_COLORS } from '../../types'

export function AchievementList() {
  const { profile } = useProfileStore()
  const unlockedIds = new Set(profile.achievements.map((a) => a.id))

  const unlocked = ACHIEVEMENT_DEFINITIONS.filter((d) => unlockedIds.has(d.id))
  const locked = ACHIEVEMENT_DEFINITIONS.filter(
    (d) => !unlockedIds.has(d.id) && d.rarity !== 'Secret'
  )

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: Spacing.md,
        }}
      >
        <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '700' }}>
          Achievements
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
          {unlocked.length}/{ACHIEVEMENT_DEFINITIONS.length}
        </Text>
      </View>

      {/* Unlocked */}
      {unlocked.map((def) => {
        const color = RARITY_COLORS[def.rarity]
        return (
          <View
            key={def.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              marginBottom: Spacing.sm,
              paddingVertical: 4,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: color + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={def.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '600' }}>
                {def.name}
              </Text>
              <Text style={{ color: color, fontSize: 11 }}>
                {def.rarity} — {def.description}
              </Text>
            </View>
          </View>
        )
      })}

      {/* Locked */}
      {locked.slice(0, 5).map((def) => (
        <View
          key={def.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            marginBottom: Spacing.sm,
            paddingVertical: 4,
            opacity: 0.4,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.surfaceLight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              {def.name}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
              {def.description}
            </Text>
          </View>
        </View>
      ))}

      {locked.length > 5 && (
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 12,
            textAlign: 'center',
            marginTop: Spacing.xs,
          }}
        >
          +{locked.length - 5} more to unlock
        </Text>
      )}
    </View>
  )
}
