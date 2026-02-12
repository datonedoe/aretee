import { useCallback } from 'react'
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useAudioStore } from '../../src/stores/audioStore'
import { WaveformVisualizer } from '../../src/components/audio/WaveformVisualizer'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SeekBar({
  position,
  duration,
  onSeek,
}: {
  position: number
  duration: number
  onSeek: (seconds: number) => void
}) {
  const [barWidth, setBarWidth] = useState(0)
  const progress = duration > 0 ? position / duration : 0

  const handleLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width)
  }

  const handlePress = (e: { nativeEvent: { locationX: number } }) => {
    if (barWidth > 0 && duration > 0) {
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth))
      onSeek(ratio * duration)
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      onLayout={handleLayout}
      style={{
        height: 40,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          height: 4,
          backgroundColor: Colors.border,
          borderRadius: 2,
        }}
      >
        <View
          style={{
            height: 4,
            width: `${progress * 100}%`,
            backgroundColor: Colors.accent,
            borderRadius: 2,
          }}
        />
        {/* Thumb */}
        <View
          style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            top: -6,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: Colors.accent,
            marginLeft: -8,
          }}
        />
      </View>
    </Pressable>
  )
}

export default function PlayerScreen() {
  const router = useRouter()
  const {
    playback,
    getCurrentEpisode,
    pause,
    resume,
    seekTo,
    setSpeed,
  } = useAudioStore()

  const episode = getCurrentEpisode()

  const handleClose = useCallback(() => {
    router.back()
  }, [router])

  const handleSkip = useCallback(
    (seconds: number) => {
      const newPos = Math.max(0, Math.min(playback.position + seconds, playback.duration))
      seekTo(newPos)
    },
    [playback, seekTo]
  )

  if (!episode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>
            No episode playing
          </Text>
          <Pressable onPress={handleClose} style={{ marginTop: Spacing.lg }}>
            <Text style={{ color: Colors.primary, fontSize: 15 }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
        }}
      >
        <Pressable onPress={handleClose} hitSlop={8}>
          <Ionicons name="chevron-down" size={28} color={Colors.textSecondary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
            NOW PLAYING
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.xl }}>
        {/* Waveform visualization */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            alignItems: 'center',
            marginBottom: Spacing.xl,
          }}
        >
          <WaveformVisualizer
            isPlaying={playback.isPlaying}
            barCount={30}
            height={80}
          />
        </View>

        {/* Episode title */}
        <Text
          style={{
            color: Colors.text,
            fontSize: 22,
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          {episode.title}
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginTop: Spacing.xs,
          }}
        >
          {episode.cards.length} concepts covered
        </Text>

        {/* Seek bar */}
        <View style={{ marginTop: Spacing.xl }}>
          <SeekBar
            position={playback.position}
            duration={playback.duration}
            onSeek={seekTo}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: -4,
            }}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              {formatTime(playback.position)}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              {formatTime(playback.duration)}
            </Text>
          </View>
        </View>

        {/* Playback controls */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.xl,
            marginTop: Spacing.lg,
          }}
        >
          {/* Rewind 15s */}
          <Pressable onPress={() => handleSkip(-15)} hitSlop={8}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="play-back" size={28} color={Colors.text} />
              <Text style={{ color: Colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                15s
              </Text>
            </View>
          </Pressable>

          {/* Play/Pause */}
          <Pressable
            onPress={() => (playback.isPlaying ? pause() : resume())}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: Colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name={playback.isPlaying ? 'pause' : 'play'}
              size={28}
              color="#fff"
              style={playback.isPlaying ? undefined : { marginLeft: 3 }}
            />
          </Pressable>

          {/* Forward 15s */}
          <Pressable onPress={() => handleSkip(15)} hitSlop={8}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="play-forward" size={28} color={Colors.text} />
              <Text style={{ color: Colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                15s
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Speed controls */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 13,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: Spacing.sm,
            }}
          >
            Playback Speed
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: Spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            {SPEED_OPTIONS.map((speed) => (
              <Pressable
                key={speed}
                onPress={() => setSpeed(speed)}
                style={{
                  backgroundColor:
                    playback.playbackSpeed === speed
                      ? Colors.primary
                      : Colors.surface,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  borderWidth: 1,
                  borderColor:
                    playback.playbackSpeed === speed
                      ? Colors.primary
                      : Colors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      playback.playbackSpeed === speed ? '#fff' : Colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {speed}x
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Script preview */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 13,
              fontWeight: '600',
              marginBottom: Spacing.sm,
            }}
          >
            Script
          </Text>
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              maxHeight: 200,
            }}
          >
            <ScrollView nestedScrollEnabled>
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                {episode.script}
              </Text>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
