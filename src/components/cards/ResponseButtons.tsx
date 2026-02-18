import { memo, useCallback } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { ReviewResponse, ResponseColors, CardState } from '../../types'
import { SRSEngine } from '../../services/srs/engine'
import { formatInterval } from '../../utils/dates'
import { Spacing, BorderRadius, Colors } from '../../utils/constants'
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../services/haptics'

interface ResponseButtonsProps {
  currentInterval: number
  currentEase: number
  reviewCount: number
  onResponse: (response: ReviewResponse) => void
  // FSRS fields
  currentDifficulty?: number
  currentStability?: number
  currentState?: CardState
  lastReview?: Date | null
  currentLapses?: number
  desiredRetention?: number
}

const RESPONSE_LABELS: Record<ReviewResponse, string> = {
  [ReviewResponse.Again]: 'Again',
  [ReviewResponse.Hard]: 'Hard',
  [ReviewResponse.Good]: 'Good',
  [ReviewResponse.Easy]: 'Easy',
}

const RESPONSE_ORDER: ReviewResponse[] = [
  ReviewResponse.Again,
  ReviewResponse.Hard,
  ReviewResponse.Good,
  ReviewResponse.Easy,
]

const RESPONSE_HAPTICS: Record<ReviewResponse, () => void> = {
  [ReviewResponse.Again]: hapticError,
  [ReviewResponse.Hard]: hapticMedium,
  [ReviewResponse.Good]: hapticLight,
  [ReviewResponse.Easy]: hapticSuccess,
}

export const ResponseButtons = memo(function ResponseButtons({
  currentInterval,
  currentEase,
  reviewCount,
  onResponse,
  currentDifficulty = 0,
  currentStability = 0,
  currentState = CardState.New,
  lastReview = null,
  currentLapses = 0,
  desiredRetention = 0.9,
}: ResponseButtonsProps) {
  const previews = SRSEngine.getPreviewIntervals(
    currentInterval,
    currentEase,
    reviewCount,
    currentDifficulty,
    currentStability,
    currentState,
    lastReview,
    currentLapses,
    desiredRetention
  )

  return (
    <View style={{ width: '100%', gap: Spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {RESPONSE_ORDER.map((response, index) => {
          const color = ResponseColors[response]
          return (
            <Pressable
              key={response}
              onPress={() => { RESPONSE_HAPTICS[response](); onResponse(response) }}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? color + '30' : color + '15',
                borderRadius: BorderRadius.md,
                paddingVertical: Spacing.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: color + '40',
              })}
            >
              <Text style={{ color, fontSize: 15, fontWeight: '700' }}>
                {RESPONSE_LABELS[response]}
              </Text>
              <Text style={{ color: color + 'AA', fontSize: 11, marginTop: 2 }}>
                {formatInterval(previews[response])}
              </Text>
              {Platform.OS === 'web' && (
                <Text style={{ color: Colors.textSecondary, fontSize: 10, marginTop: 2 }}>
                  {index + 1}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
})
