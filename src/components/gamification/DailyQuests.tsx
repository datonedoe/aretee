import { memo } from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { useProfileStore } from '../../stores/profileStore'
import { getQuestDefinition } from '../../services/gamification'

export const DailyQuests = memo(function DailyQuests() {
  const { profile } = useProfileStore()
  const quests = profile.dailyQuests

  if (!quests) return null

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
          Daily Quests
        </Text>
        {quests.allComplete && (
          <View
            style={{
              backgroundColor: Colors.success + '20',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: BorderRadius.full,
            }}
          >
            <Text style={{ color: Colors.success, fontSize: 11, fontWeight: '600' }}>
              ALL DONE
            </Text>
          </View>
        )}
      </View>

      {quests.quests.map((q) => {
        const def = getQuestDefinition(q.questId)
        if (!def) return null

        const progress = q.target > 0 ? q.current / q.target : 0
        const progressPct = Math.min(progress * 100, 100)

        return (
          <View key={q.questId} style={{ marginBottom: Spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons
                  name={q.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={q.completed ? Colors.success : Colors.textSecondary}
                />
                <Text
                  style={{
                    color: q.completed ? Colors.success : Colors.text,
                    fontSize: 13,
                    fontWeight: '500',
                    textDecorationLine: q.completed ? 'line-through' : 'none',
                  }}
                >
                  {def.title}
                </Text>
              </View>
              <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
                {q.current}/{q.target}
              </Text>
            </View>

            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 11,
                marginLeft: 22,
                marginBottom: 4,
              }}
            >
              {def.description} — {def.xpReward} XP
            </Text>

            <View
              style={{
                height: 4,
                backgroundColor: Colors.surfaceLight,
                borderRadius: BorderRadius.full,
                overflow: 'hidden',
                marginLeft: 22,
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  backgroundColor: q.completed ? Colors.success : Colors.primary,
                  borderRadius: BorderRadius.full,
                }}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
})
