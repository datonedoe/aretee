import { useEffect, useRef } from 'react'
import { View, Text, Animated, Easing } from 'react-native'
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

  const flameScale = useRef(new Animated.Value(1)).current
  const flameRotation = useRef(new Animated.Value(0)).current
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (animRef.current) animRef.current.stop()

    if (currentStreak > 0) {
      animRef.current = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(flameScale, {
              toValue: 1.15,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(flameScale, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(flameRotation, {
              toValue: -3,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(flameRotation, {
              toValue: 3,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ])
      animRef.current.start()
    }

    return () => {
      if (animRef.current) animRef.current.stop()
    }
  }, [currentStreak])

  const rotateInterpolation = flameRotation.interpolate({
    inputRange: [-3, 3],
    outputRange: ['-3deg', '3deg'],
  })

  const flameColor =
    currentStreak >= 30
      ? '#F59E0B'
      : currentStreak >= 7
        ? '#F97316'
        : currentStreak > 0
          ? '#EF4444'
          : Colors.textSecondary

  const animatedFlameStyle = currentStreak > 0
    ? { transform: [{ scale: flameScale }, { rotate: rotateInterpolation }] }
    : undefined

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Animated.View style={animatedFlameStyle}>
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
      <Animated.View style={animatedFlameStyle}>
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
