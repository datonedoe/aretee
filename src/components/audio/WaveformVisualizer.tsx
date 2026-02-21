import { useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'
import { Colors } from '../../utils/constants'

interface WaveformVisualizerProps {
  isPlaying: boolean
  barCount?: number
  height?: number
  color?: string
}

function WaveBar({
  index,
  isPlaying,
  height,
  color,
}: {
  index: number
  isPlaying: boolean
  height: number
  color: string
}) {
  const barHeight = useRef(new Animated.Value(0.3)).current
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (animRef.current) {
      animRef.current.stop()
    }

    if (isPlaying) {
      const targetHeight = 0.2 + Math.random() * 0.8
      const duration = 300 + Math.random() * 400

      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(barHeight, {
            toValue: targetHeight,
            duration,
            easing: Easing.inOut(Easing.ease),
            delay: index * 80,
            useNativeDriver: false,
          }),
          Animated.timing(barHeight, {
            toValue: 0.2,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
      animRef.current.start()
    } else {
      animRef.current = Animated.timing(barHeight, {
        toValue: 0.15,
        duration: 300,
        useNativeDriver: false,
      })
      animRef.current.start()
    }

    return () => {
      if (animRef.current) animRef.current.stop()
    }
  }, [isPlaying, index, barHeight])

  const animatedHeight = barHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  })

  return (
    <Animated.View
      style={{
        width: 3,
        borderRadius: 1.5,
        backgroundColor: color,
        opacity: isPlaying ? 1 : 0.4,
        height: animatedHeight,
      }}
    />
  )
}

export function WaveformVisualizer({
  isPlaying,
  barCount = 20,
  height = 32,
  color = Colors.accent,
}: WaveformVisualizerProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height,
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <WaveBar
          key={i}
          index={i}
          isPlaying={isPlaying}
          height={height}
          color={color}
        />
      ))}
    </View>
  )
}
