import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
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
  const barHeight = useSharedValue(0.3)

  useEffect(() => {
    if (isPlaying) {
      barHeight.value = withDelay(
        index * 80,
        withRepeat(
          withTiming(0.2 + Math.random() * 0.8, {
            duration: 300 + Math.random() * 400,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        )
      )
    } else {
      barHeight.value = withTiming(0.15, { duration: 300 })
    }
  }, [isPlaying, index, barHeight])

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value * height,
  }))

  return (
    <Animated.View
      style={[
        {
          width: 3,
          borderRadius: 1.5,
          backgroundColor: color,
          opacity: isPlaying ? 1 : 0.4,
        },
        animatedStyle,
      ]}
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
