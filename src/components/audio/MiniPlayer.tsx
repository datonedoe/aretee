import { View, Text, Pressable, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { useAudioStore } from '../../stores/audioStore'
import { WaveformVisualizer } from './WaveformVisualizer'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface MiniPlayerProps {
  onExpand?: () => void
}

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const {
    playback,
    getCurrentEpisode,
    pause,
    resume,
    stop,
  } = useAudioStore()

  const episode = getCurrentEpisode()
  const translateY = useRef(new Animated.Value(100)).current

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: episode ? 0 : 100,
      damping: 20,
      stiffness: 200,
      mass: 0.5,
      useNativeDriver: true,
    }).start()
  }, [episode])

  if (!episode) return null

  const progress = playback.duration > 0 ? playback.position / playback.duration : 0

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 85, // Above tab bar
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        transform: [{ translateY }],
      }}
    >
      {/* Progress bar */}
      <View
        style={{
          height: 2,
          backgroundColor: Colors.border,
        }}
      >
        <View
          style={{
            height: 2,
            width: `${progress * 100}%`,
            backgroundColor: Colors.accent,
          }}
        />
      </View>

      <Pressable
        onPress={onExpand}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          gap: Spacing.sm,
        }}
      >
        {/* Waveform */}
        <WaveformVisualizer
          isPlaying={playback.isPlaying}
          barCount={8}
          height={24}
        />

        {/* Episode info */}
        <View style={{ flex: 1, marginLeft: Spacing.xs }}>
          <Text
            style={{
              color: Colors.text,
              fontSize: 13,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {episode.title}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 11, marginTop: 1 }}>
            {formatTime(playback.position)} / {formatTime(playback.duration)}
          </Text>
        </View>

        {/* Speed indicator */}
        {playback.playbackSpeed !== 1.0 && (
          <View
            style={{
              backgroundColor: Colors.primary + '30',
              borderRadius: BorderRadius.sm,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '600' }}>
              {playback.playbackSpeed}x
            </Text>
          </View>
        )}

        {/* Play/Pause */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.()
            playback.isPlaying ? pause() : resume()
          }}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name={playback.isPlaying ? 'pause' : 'play'}
            size={18}
            color="#fff"
            style={playback.isPlaying ? undefined : { marginLeft: 2 }}
          />
        </Pressable>

        {/* Stop */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.()
            stop()
          }}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  )
}
