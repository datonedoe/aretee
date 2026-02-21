import React, { useEffect, useRef } from 'react'
import { View, Text, Animated } from 'react-native'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { getLevelProgress } from '../../services/gamification'
import { useProfileStore } from '../../stores/profileStore'

interface XPBarProps {
  compact?: boolean
}

function getBarColor(progress: number): string {
  if (progress >= 0.75) return Colors.success
  if (progress >= 0.4) return Colors.accent
  return Colors.primary
}

export const XPBar = React.memo(function XPBar({ compact = false }: XPBarProps) {
  const { profile } = useProfileStore()
  const { currentLevel, nextLevel, xpIntoLevel, xpForNextLevel, progress } =
    getLevelProgress(profile.totalXP)

  const barProgress = useRef(new Animated.Value(0)).current
  const barColor = getBarColor(progress)

  useEffect(() => {
    Animated.spring(barProgress, {
      toValue: progress,
      damping: 20,
      stiffness: 100,
      mass: 0.5,
      useNativeDriver: false,
    }).start()
  }, [progress])

  const animatedBarWidth = barProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  })

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
            style={{
              height: '100%',
              borderRadius: BorderRadius.full,
              backgroundColor: barColor,
              width: animatedBarWidth,
            }}
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
          style={{
            height: '100%',
            borderRadius: BorderRadius.full,
            backgroundColor: barColor,
            width: animatedBarWidth,
          }}
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
})
