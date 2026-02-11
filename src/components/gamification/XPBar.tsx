import { useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { getLevelProgress } from '../../services/gamification'
import { useProfileStore } from '../../stores/profileStore'

interface XPBarProps {
  compact?: boolean
}

export function XPBar({ compact = false }: XPBarProps) {
  const { profile } = useProfileStore()
  const { currentLevel, nextLevel, xpIntoLevel, xpForNextLevel, progress } =
    getLevelProgress(profile.totalXP)

  const barProgress = useSharedValue(0)

  useEffect(() => {
    barProgress.value = withSpring(progress, {
      damping: 20,
      stiffness: 100,
      mass: 0.5,
    })
  }, [progress])

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(barProgress.value * 100, 100)}%`,
    backgroundColor: interpolateColor(
      barProgress.value,
      [0, 0.5, 1],
      [Colors.primary, Colors.accent, Colors.success]
    ),
  }))

  if (compact) {
    return (
      <View style={{ gap: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '700' }}>
            Lv. {currentLevel.level} {currentLevel.title}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
            {profile.totalXP.toLocaleString()} XP
          </Text>
        </View>
        <View
          style={{
            height: 4,
            backgroundColor: Colors.surfaceLight,
            borderRadius: BorderRadius.full,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              {
                height: '100%',
                borderRadius: BorderRadius.full,
              },
              animatedBarStyle,
            ]}
          />
        </View>
      </View>
    )
  }

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
          marginBottom: Spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ color: Colors.accent, fontSize: 20, fontWeight: '800' }}>
            Lv. {currentLevel.level}
          </Text>
          <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>
            {currentLevel.title}
          </Text>
        </View>
        <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
          {profile.totalXP.toLocaleString()} XP
        </Text>
      </View>

      <View
        style={{
          height: 8,
          backgroundColor: Colors.surfaceLight,
          borderRadius: BorderRadius.full,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              borderRadius: BorderRadius.full,
            },
            animatedBarStyle,
          ]}
        />
      </View>

      {nextLevel && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
            {xpIntoLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>
            Next: {nextLevel.title}
          </Text>
        </View>
      )}
    </View>
  )
}
