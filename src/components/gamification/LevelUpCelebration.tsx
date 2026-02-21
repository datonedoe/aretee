import { useEffect, useRef } from 'react'
import { View, Text, Pressable, Dimensions, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { getLevelForXP, LEVEL_DEFINITIONS } from '../../services/gamification'
import { hapticCelebration } from '../../services/haptics'

interface LevelUpCelebrationProps {
  newLevel: number
  onDismiss: () => void
}

export function LevelUpCelebration({ newLevel, onDismiss }: LevelUpCelebrationProps) {
  const levelDef = LEVEL_DEFINITIONS.find((d) => d.level === newLevel) ??
    LEVEL_DEFINITIONS[0]

  const backdropOpacity = useRef(new Animated.Value(0)).current
  const badgeScale = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const unlockOpacity = useRef(new Animated.Value(0)).current
  const glowOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    hapticCelebration()

    // Backdrop fade in
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    // Glow sequence
    Animated.sequence([
      Animated.timing(glowOpacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
    ]).start()

    // Badge pops in (delayed)
    setTimeout(() => {
      Animated.spring(badgeScale, {
        toValue: 1,
        damping: 8,
        stiffness: 150,
        mass: 0.8,
        useNativeDriver: true,
      }).start()
    }, 200)

    // Title fades in
    setTimeout(() => {
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }, 500)

    // Unlock fades in
    setTimeout(() => {
      Animated.timing(unlockOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    }, 800)
  }, [])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        opacity: backdropOpacity,
      }}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Glow effect */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: Colors.primary,
            opacity: glowOpacity,
          }}
        />

        {/* Badge */}
        <Animated.View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: Colors.primary + '30',
            borderWidth: 3,
            borderColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: badgeScale }],
          }}
        >
          <Ionicons name="star" size={56} color={Colors.accent} />
        </Animated.View>

        {/* Level text */}
        <Animated.View style={{ alignItems: 'center', marginTop: Spacing.lg, opacity: titleOpacity }}>
          <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '600', letterSpacing: 2 }}>
            LEVEL UP
          </Text>
          <Text style={{ color: Colors.text, fontSize: 40, fontWeight: '900', marginTop: 4 }}>
            Level {levelDef.level}
          </Text>
          <Text style={{ color: Colors.primary, fontSize: 20, fontWeight: '600', marginTop: 4 }}>
            {levelDef.title}
          </Text>
        </Animated.View>

        {/* Unlock text */}
        {levelDef.unlock ? (
          <Animated.View
            style={{
              marginTop: Spacing.xl,
              backgroundColor: Colors.surface,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: Colors.accent + '40',
              opacity: unlockOpacity,
            }}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
              UNLOCKED
            </Text>
            <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 4 }}>
              {levelDef.unlock}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View style={{ marginTop: Spacing.xxl, opacity: unlockOpacity }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
            Tap to continue
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
