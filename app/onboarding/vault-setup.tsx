import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, BorderRadius } from '../../src/utils/constants'
import { useOnboardingStore } from '../../src/stores/onboardingStore'
import { useSettingsStore } from '../../src/stores/settingsStore'
import { AnimatedProgressBar } from '../../src/components/onboarding/AnimatedProgressBar'
import { getFileService } from '../../src/services/platform'
import { enableDemoMode } from '../../src/utils/demo-data'
import { hapticMedium, hapticSuccess, hapticLight } from '../../src/services/haptics'

export default function VaultSetupScreen() {
  const router = useRouter()
  const { setStep, completeOnboarding } = useOnboardingStore()
  const { setVaultPath } = useSettingsStore()
  const [vaultSelected, setVaultSelected] = useState(false)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const fadeValue = useSharedValue(0)
  const slideValue = useSharedValue(30)

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 500 })
    slideValue.value = withTiming(0, { duration: 500 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: slideValue.value }],
  }))

  const handlePickFolder = useCallback(async () => {
    hapticLight()
    const fileService = getFileService()
    const path = await fileService.pickFolder()
    if (path) {
      hapticSuccess()
      await setVaultPath(path)
      setSelectedPath(path)
      setVaultSelected(true)
    }
  }, [setVaultPath])

  const handleTryDemo = useCallback(async () => {
    hapticMedium()
    enableDemoMode()
    await setVaultPath('/demo')
    setSelectedPath('Demo Mode')
    setVaultSelected(true)
  }, [setVaultPath])

  const handleFinish = useCallback(async () => {
    hapticSuccess()
    await completeOnboarding()
    setStep('ready')
    router.push('/onboarding/ready')
  }, [completeOnboarding, setStep, router])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Animated.View
        style={[
          {
            flex: 1,
            padding: Spacing.lg,
          },
          animatedStyle,
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Back</Text>
        </Pressable>

        {/* Progress */}
        <AnimatedProgressBar currentStep="vault-setup" />

        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800' }}>
          Connect your vault
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 15,
            marginTop: Spacing.xs,
            lineHeight: 22,
          }}
        >
          Aretee reads flashcards from your Obsidian vault. You can also try our demo decks.
        </Text>

        {/* Options */}
        <View style={{ marginTop: Spacing.xl, gap: Spacing.md }}>
          {/* Pick Folder */}
          <Pressable
            onPress={handlePickFolder}
            style={({ pressed }) => ({
              backgroundColor:
                vaultSelected && selectedPath !== 'Demo Mode'
                  ? Colors.success + '15'
                  : Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              borderWidth: 2,
              borderColor:
                vaultSelected && selectedPath !== 'Demo Mode'
                  ? Colors.success
                  : Colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: BorderRadius.md,
                backgroundColor: Colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="folder-open" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.text, fontSize: 17, fontWeight: '700' }}>
                Choose Obsidian Vault
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {vaultSelected && selectedPath !== 'Demo Mode'
                  ? `Selected: ${selectedPath}`
                  : 'Select your vault folder'}
              </Text>
            </View>
            {vaultSelected && selectedPath !== 'Demo Mode' && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            )}
          </Pressable>

          {/* Demo Mode */}
          <Pressable
            onPress={handleTryDemo}
            style={({ pressed }) => ({
              backgroundColor:
                vaultSelected && selectedPath === 'Demo Mode'
                  ? Colors.accent + '15'
                  : Colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              borderWidth: 2,
              borderColor:
                vaultSelected && selectedPath === 'Demo Mode'
                  ? Colors.accent
                  : Colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: BorderRadius.md,
                backgroundColor: Colors.accent + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="flask" size={24} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.text, fontSize: 17, fontWeight: '700' }}>
                Try Demo Mode
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                3 sample decks · Spanish, Mandarin, Quant
              </Text>
            </View>
            {vaultSelected && selectedPath === 'Demo Mode' && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
            )}
          </Pressable>
        </View>

        {/* Info */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            marginTop: Spacing.lg,
            flexDirection: 'row',
            gap: Spacing.sm,
          }}
        >
          <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 13,
              flex: 1,
              lineHeight: 20,
            }}
          >
            Flashcards are parsed from markdown files using :: or ? separators. Your vault stays on
            your device.
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue */}
        <Pressable
          onPress={handleFinish}
          disabled={!vaultSelected}
          style={({ pressed }) => ({
            backgroundColor: vaultSelected ? Colors.primary : Colors.surface,
            paddingVertical: Spacing.md + 2,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            opacity: pressed && vaultSelected ? 0.85 : vaultSelected ? 1 : 0.5,
          })}
        >
          <Text
            style={{
              color: vaultSelected ? '#fff' : Colors.textSecondary,
              fontSize: 17,
              fontWeight: '700',
            }}
          >
            Continue
          </Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  )
}
