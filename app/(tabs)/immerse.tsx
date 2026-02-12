import { useEffect, useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { useImmersionStore } from '../../src/stores/immersionStore'
import { translateWord } from '../../src/services/immersion/api'
import {
  ImmersionItem,
  CONTENT_TYPE_LABELS,
  ContentType,
  CONTENT_TYPES,
} from '../../src/types/immersion'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_HEIGHT = SCREEN_HEIGHT - 180 // account for tab bar + safe area

function ImmersionCard({
  item,
  isActive,
  onTooEasy,
  onTooHard,
}: {
  item: ImmersionItem
  isActive: boolean
  onTooEasy: () => void
  onTooHard: () => void
}) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const {
    showTranslation,
    setShowTranslation,
    selectedWord,
    setSelectedWord,
    setIsTranslating,
    addLearnedWord,
    language,
  } = useImmersionStore()

  // Auto-play audio when card becomes active
  useEffect(() => {
    if (isActive && item.audio_url) {
      playAudio()
    }
    return () => {
      soundRef.current?.unloadAsync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const playAudio = useCallback(async () => {
    if (!item.audio_url) return
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: `http://localhost:8000${item.audio_url}` },
        { shouldPlay: true }
      )
      soundRef.current = sound
      setIsPlaying(true)
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false)
        }
      })
    } catch {
      setIsPlaying(false)
    }
  }, [item.audio_url])

  const handleWordPress = useCallback(
    async (word: string) => {
      // Clean word of punctuation
      const cleanWord = word.replace(/[.,!?¿¡;:""''«»—\-()]/g, '').trim()
      if (!cleanWord) return

      setIsTranslating(true)
      try {
        const result = await translateWord(cleanWord, language, item.text)
        setSelectedWord({
          word: result.word,
          translation: result.translation,
          partOfSpeech: result.part_of_speech,
          example: result.example,
        })
      } catch {
        setSelectedWord({
          word: cleanWord,
          translation: '(translation unavailable)',
          partOfSpeech: '',
          example: '',
        })
      }
      setIsTranslating(false)
    },
    [language, item.text, setIsTranslating, setSelectedWord]
  )

  const handleAddToSRS = useCallback(() => {
    if (selectedWord) {
      addLearnedWord(selectedWord.word, selectedWord.translation)
      setSelectedWord(null)
    }
  }, [selectedWord, addLearnedWord, setSelectedWord])

  // Split text into tappable words
  const words = item.text.split(/(\s+)/)

  return (
    <View
      style={{
        height: CARD_HEIGHT,
        width: SCREEN_WIDTH,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.md,
        padding: Spacing.lg,
        justifyContent: 'space-between',
      }}
    >
      {/* Content type badge + profanity warning */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <View
          style={{
            backgroundColor: Colors.primary + '25',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: BorderRadius.full,
          }}
        >
          <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '600' }}>
            {CONTENT_TYPE_LABELS[item.content_type]}
          </Text>
        </View>
        {item.has_profanity && (
          <View
            style={{
              backgroundColor: Colors.error + '25',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: BorderRadius.full,
            }}
          >
            <Text style={{ color: Colors.error, fontSize: 11, fontWeight: '600' }}>⚠️ Mature</Text>
          </View>
        )}
        {item.region && (
          <View
            style={{
              backgroundColor: Colors.accent + '20',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: BorderRadius.full,
            }}
          >
            <Text style={{ color: Colors.accent, fontSize: 11 }}>{item.region}</Text>
          </View>
        )}
      </View>

      {/* Main content - tappable words */}
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: Spacing.lg }}>
        <Text style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {words.map((w, i) => {
            if (w.trim() === '') {
              return (
                <Text key={i} style={{ color: Colors.text, fontSize: 20, lineHeight: 32 }}>
                  {w}
                </Text>
              )
            }
            return (
              <Text
                key={i}
                onLongPress={() => handleWordPress(w)}
                style={{
                  color: Colors.text,
                  fontSize: 20,
                  lineHeight: 32,
                  fontWeight: '500',
                }}
              >
                {w}
              </Text>
            )
          })}
        </Text>

        {/* Translation overlay */}
        {showTranslation && (
          <View
            style={{
              marginTop: Spacing.lg,
              backgroundColor: Colors.background,
              borderRadius: BorderRadius.md,
              padding: Spacing.md,
            }}
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 16, lineHeight: 26 }}>
              {item.translation}
            </Text>
          </View>
        )}

        {/* Word translation popup */}
        {selectedWord && (
          <View
            style={{
              marginTop: Spacing.md,
              backgroundColor: Colors.primary + '15',
              borderRadius: BorderRadius.md,
              padding: Spacing.md,
              borderWidth: 1,
              borderColor: Colors.primary + '40',
            }}
          >
            <Text style={{ color: Colors.primary, fontSize: 18, fontWeight: '700' }}>
              {selectedWord.word}
            </Text>
            <Text style={{ color: Colors.text, fontSize: 16, marginTop: 4 }}>
              {selectedWord.translation}
              {selectedWord.partOfSpeech ? ` (${selectedWord.partOfSpeech})` : ''}
            </Text>
            {selectedWord.example ? (
              <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: 4, fontStyle: 'italic' }}>
                {selectedWord.example}
              </Text>
            ) : null}
            <Pressable
              onPress={handleAddToSRS}
              style={{
                backgroundColor: Colors.primary,
                borderRadius: BorderRadius.sm,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginTop: Spacing.sm,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>+ Add to Deck</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom bar */}
      <View>
        {/* Action buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.md,
          }}
        >
          <Pressable
            onPress={onTooEasy}
            style={{
              backgroundColor: Colors.success + '20',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: BorderRadius.full,
            }}
          >
            <Text style={{ color: Colors.success, fontSize: 13, fontWeight: '600' }}>
              ← Too Easy
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Pressable
              onPress={() => setShowTranslation(!showTranslation)}
              style={{
                backgroundColor: Colors.accent + '20',
                width: 40,
                height: 40,
                borderRadius: BorderRadius.full,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={showTranslation ? 'eye-off' : 'eye'}
                size={20}
                color={Colors.accent}
              />
            </Pressable>
            <Pressable
              onPress={playAudio}
              style={{
                backgroundColor: Colors.primary + '20',
                width: 40,
                height: 40,
                borderRadius: BorderRadius.full,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'volume-high'}
                size={20}
                color={Colors.primary}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={onTooHard}
            style={{
              backgroundColor: Colors.error + '20',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: BorderRadius.full,
            }}
          >
            <Text style={{ color: Colors.error, fontSize: 13, fontWeight: '600' }}>
              Too Hard →
            </Text>
          </Pressable>
        </View>

        {/* Info bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  item.difficulty_level <= 3
                    ? Colors.success
                    : item.difficulty_level <= 6
                      ? Colors.warning
                      : Colors.error,
              }}
            />
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
              Lvl {item.difficulty_level}
            </Text>
          </View>
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
            {item.text.split(/\s+/).length} words
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>{item.topic}</Text>
        </View>
      </View>
    </View>
  )
}

export default function ImmerseScreen() {
  const {
    feedItems,
    currentIndex,
    isLoading,
    error,
    difficulty,
    loadFeed,
    recordInteraction,
    nextItem,
    language,
  } = useImmersionStore()

  const flatListRef = useRef<FlatList>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<ContentType | undefined>(undefined)

  useEffect(() => {
    if (feedItems.length === 0) {
      loadFeed(selectedType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    []
  )

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current

  const handleTooEasy = useCallback(
    (itemId: string) => {
      recordInteraction(itemId, 'too_easy')
      nextItem()
      if (flatListRef.current && currentIndex < feedItems.length - 1) {
        flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true })
      }
    },
    [recordInteraction, nextItem, currentIndex, feedItems.length]
  )

  const handleTooHard = useCallback(
    (itemId: string) => {
      recordInteraction(itemId, 'too_hard')
      nextItem()
      if (flatListRef.current && currentIndex < feedItems.length - 1) {
        flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true })
      }
    },
    [recordInteraction, nextItem, currentIndex, feedItems.length]
  )

  if (isLoading && feedItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ color: Colors.textSecondary, marginTop: Spacing.md, fontSize: 15 }}>
            Generating immersion content...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error && feedItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: Spacing.xl,
          }}
        >
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text
            style={{
              color: Colors.error,
              fontSize: 16,
              marginTop: Spacing.md,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={() => loadFeed(selectedType)}
            style={{
              backgroundColor: Colors.primary,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              marginTop: Spacing.lg,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Retry</Text>
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
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '800' }}>Immerse</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
            Level {Math.round(difficulty)} · {language.toUpperCase()}
          </Text>
        </View>
        <Pressable
          onPress={() => loadFeed(selectedType)}
          style={{
            backgroundColor: Colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: BorderRadius.full,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Ionicons name="refresh" size={18} color={Colors.text} />
        </Pressable>
      </View>

      {/* Content type filter */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: Spacing.md,
          paddingBottom: Spacing.sm,
          gap: 6,
        }}
      >
        <Pressable
          onPress={() => {
            setSelectedType(undefined)
            loadFeed(undefined)
          }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: BorderRadius.full,
            backgroundColor: selectedType === undefined ? Colors.primary : Colors.surface,
          }}
        >
          <Text
            style={{
              color: selectedType === undefined ? '#fff' : Colors.textSecondary,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            All
          </Text>
        </Pressable>
        {CONTENT_TYPES.map((ct) => (
          <Pressable
            key={ct}
            onPress={() => {
              setSelectedType(ct)
              loadFeed(ct)
            }}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: BorderRadius.full,
              backgroundColor: selectedType === ct ? Colors.primary : Colors.surface,
            }}
          >
            <Text
              style={{
                color: selectedType === ct ? '#fff' : Colors.textSecondary,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {CONTENT_TYPE_LABELS[ct]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Feed */}
      <FlatList
        ref={flatListRef}
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ImmersionCard
            item={item}
            isActive={index === activeIndex}
            onTooEasy={() => handleTooEasy(item.id)}
            onTooHard={() => handleTooHard(item.id)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={CARD_HEIGHT + Spacing.md}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ paddingVertical: Spacing.sm, gap: Spacing.md }}
        getItemLayout={(_, index) => ({
          length: CARD_HEIGHT + Spacing.md,
          offset: (CARD_HEIGHT + Spacing.md) * index,
          index,
        })}
      />
    </SafeAreaView>
  )
}
