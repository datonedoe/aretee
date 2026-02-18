/**
 * DeckListItem — Memoized deck card for the Flash screen FlatList.
 * Prevents re-renders when other decks change.
 */
import React, { useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../utils/constants'
import { hapticLight, hapticMedium } from '../../services/haptics'
import type { Deck } from '../../types'

interface DeckListItemProps {
  deck: Deck
  dueCount: number
  onReview: (deckId: string) => void
  onSocratic: (deckId: string) => void
  onFeynman: (deckId: string) => void
}

function DeckListItemInner({
  deck,
  dueCount,
  onReview,
  onSocratic,
  onFeynman,
}: DeckListItemProps) {
  const handlePress = useCallback(() => {
    hapticMedium()
    onReview(deck.id)
  }, [deck.id, onReview])

  const handleSocratic = useCallback(
    (e: any) => {
      e.stopPropagation?.()
      hapticLight()
      onSocratic(deck.id)
    },
    [deck.id, onSocratic]
  )

  const handleFeynman = useCallback(
    (e: any) => {
      e.stopPropagation?.()
      hapticLight()
      onFeynman(deck.id)
    },
    [deck.id, onFeynman]
  )

  return (
    <Pressable
      onPress={handlePress}
      style={{
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: dueCount > 0 ? Colors.primary + '40' : Colors.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '600' }}>
            {deck.name}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {deck.cards.length} cards total
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {/* Feynman button */}
          <Pressable
            onPress={handleFeynman}
            style={{
              backgroundColor: Colors.warning + '15',
              borderRadius: BorderRadius.full,
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="bulb-outline" size={13} color={Colors.warning} />
            <Text style={{ color: Colors.warning, fontSize: 12, fontWeight: '600' }}>
              Teach
            </Text>
          </Pressable>
          {/* Socratic button */}
          <Pressable
            onPress={handleSocratic}
            style={{
              backgroundColor: Colors.accent + '15',
              borderRadius: BorderRadius.full,
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="school-outline" size={13} color={Colors.accent} />
            <Text style={{ color: Colors.accent, fontSize: 12, fontWeight: '600' }}>
              Ask
            </Text>
          </Pressable>
          {dueCount > 0 ? (
            <View
              style={{
                backgroundColor: Colors.primary,
                borderRadius: BorderRadius.full,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                {dueCount} due
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Colors.success + '20',
                borderRadius: BorderRadius.full,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: Colors.success, fontSize: 13, fontWeight: '600' }}>
                Done
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

export const DeckListItem = React.memo(DeckListItemInner, (prev, next) => {
  return (
    prev.deck.id === next.deck.id &&
    prev.deck.name === next.deck.name &&
    prev.deck.cards.length === next.deck.cards.length &&
    prev.dueCount === next.dueCount
  )
})
