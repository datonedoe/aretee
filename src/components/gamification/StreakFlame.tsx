import { useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { useProfileStore } from '../../stores/profileStore'

interface StreakFlameProps {
  compact?: boolean
}

export function StreakFlame({ compact = false }: StreakFlameProps) {
  const { streakData } = useProfileStore()
  const { currentStreak, longestStreak, freezesRemaining, freezesMax } =
    streakData.summary

  const flameScale = useSharedValue(1)
  const flameRotation = useSharedValue(0)

  useEffect(() => {
    if (currentStreak > 0) {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
      flameRotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    }
  }, [currentStreak])

  const animatedFlameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameRotation.value}deg` },
    ],
  }))

  const flameColor =
    currentStreak >= 30
      ? '#F59E0B' // gold for 30+
      : currentStreak >= 7
        ? '#F97316' // orange for 7+
        : currentStreak > 0
          ? '#EF4444' // red for active
          : Colors.textSecondary // gray for no streak

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Animated.View style={currentStreak > 0 ? animatedFlameStyle : undefined}>
          <Ionicons name="flame" size={18} color={flameColor} />
        </Animated.View>
        <Text style={{ color: flameColor, fontSize: 14, fontWeight: '700' }}>
          {currentStreak}
        </Text>
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
        alignItems: 'center',
      }}
    >
      <Animated.View style={currentStreak > 0 ? animatedFlameStyle : undefined}>
        <Ionicons name="flame" size={44} color={flameColor} />
      </Animated.View>

      <Text
        style={{
          color: Colors.text,
          fontSize: 28,
          fontWeight: '800',
          marginTop: Spacing.xs,
        }}
      >
        {currentStreak}
      </Text>
      <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
        day streak
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: Spacing.md,
          paddingTop: Spacing.sm,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>
            {longestStreak}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>Best</Text>
        </View>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>
            {freezesRemaining}/{freezesMax}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>Freezes</Text>
        </View>
      </View>
    </View>
  )
}
