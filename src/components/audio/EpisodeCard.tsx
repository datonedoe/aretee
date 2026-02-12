import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import type { Episode } from '../../types/audio'

interface EpisodeCardProps {
  episode: Episode
  isPlaying: boolean
  isCurrent: boolean
  onPlay: () => void
  onDelete: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function EpisodeCard({
  episode,
  isPlaying,
  isCurrent,
  onPlay,
  onDelete,
}: EpisodeCardProps) {
  return (
    <Pressable
      onPress={onPlay}
      style={{
        backgroundColor: isCurrent ? Colors.primary + '15' : Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: isCurrent ? Colors.primary + '40' : Colors.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
        }}
      >
        {/* Play/Pause button */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isCurrent ? Colors.primary : Colors.surfaceLight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name={isPlaying && isCurrent ? 'pause' : 'play'}
            size={20}
            color={isCurrent ? '#fff' : Colors.accent}
            style={isPlaying && isCurrent ? undefined : { marginLeft: 2 }}
          />
        </View>

        {/* Episode info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: Colors.text,
              fontSize: 15,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {episode.title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              marginTop: 4,
            }}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              {episode.cards.length} cards
            </Text>
            <Text style={{ color: Colors.border, fontSize: 12 }}>·</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              ~{formatDuration(episode.durationEstimate)}
            </Text>
            <Text style={{ color: Colors.border, fontSize: 12 }}>·</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              {formatDate(episode.createdAt)}
            </Text>
          </View>
        </View>

        {/* Delete button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.()
            onDelete()
          }}
          hitSlop={8}
          style={{
            padding: Spacing.xs,
          }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  )
}
