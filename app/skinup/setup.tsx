import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useSkinUPStore } from '../../src/stores/skinupStore'
import { OrgSelector } from '../../src/components/skinup/OrgSelector'
import { DrainSpeed, DRAIN_SPEED_PRESETS, EveryOrgOrganization, SkinUPConfig } from '../../src/types/skinup'
import { hapticLight, hapticMedium, hapticSuccess, hapticHeavy } from '../../src/services/haptics'

const DEPOSIT_PRESETS = [5, 10, 20, 50]
const GRACE_PRESETS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
]

export default function SkinUPSetup() {
  const router = useRouter()
  const { createPool, isLoading } = useSkinUPStore()

  const [step, setStep] = useState(0)
  const [depositAmount, setDepositAmount] = useState(10)
  const [customAmount, setCustomAmount] = useState('')
  const [drainSpeed, setDrainSpeed] = useState<DrainSpeed>('medium')
  const [gracePeriod, setGracePeriod] = useState(30)
  const [selectedOrg, setSelectedOrg] = useState<EveryOrgOrganization | null>(null)

  const steps = ['Amount', 'Speed', 'Grace', 'Charity', 'Confirm']

  const canProceed = () => {
    switch (step) {
      case 0: return depositAmount > 0
      case 1: return true
      case 2: return true
      case 3: return selectedOrg !== null
      case 4: return true
      default: return false
    }
  }

  const handleConfirm = async () => {
    if (!selectedOrg) return
    hapticHeavy()

    const config: SkinUPConfig = {
      depositAmount,
      drainRate: DRAIN_SPEED_PRESETS[drainSpeed].rate,
      gracePeriodMinutes: gracePeriod,
      selectedOrgId: selectedOrg.slug,
      selectedOrgName: selectedOrg.name,
      drainSpeed,
    }

    const success = await createPool(config)
    if (success) {
      hapticSuccess()
      router.replace('/(tabs)/skinup')
    } else {
      Alert.alert('Error', 'Failed to create pool. Try again.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E8E8F0" />
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {steps.map((s, i) => (
            <View key={s} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Step 0: Deposit Amount */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>💰 How much skin?</Text>
            <Text style={styles.stepSubtitle}>This is real money. Choose an amount that hurts to lose.</Text>

            <View style={styles.presetRow}>
              {DEPOSIT_PRESETS.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.presetChip, depositAmount === amt && styles.presetChipActive]}
                  onPress={() => { setDepositAmount(amt); setCustomAmount('') }}
                >
                  <Text style={[styles.presetText, depositAmount === amt && styles.presetTextActive]}>
                    ${amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.customInput}
              placeholder="Custom amount..."
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={v => {
                setCustomAmount(v)
                const num = parseFloat(v)
                if (!isNaN(num) && num > 0) setDepositAmount(num)
              }}
            />
          </View>
        )}

        {/* Step 1: Drain Speed */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>⚡ Drain speed</Text>
            <Text style={styles.stepSubtitle}>How fast should your money disappear when you skip reviews?</Text>

            {(Object.entries(DRAIN_SPEED_PRESETS) as [DrainSpeed, typeof DRAIN_SPEED_PRESETS[DrainSpeed]][]).map(([key, preset]) => (
              <TouchableOpacity
                key={key}
                style={[styles.speedOption, drainSpeed === key && styles.speedOptionActive]}
                onPress={() => setDrainSpeed(key)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.speedLabel, drainSpeed === key && styles.speedLabelActive]}>
                    {preset.label}
                  </Text>
                  <Text style={styles.speedDesc}>{preset.description}</Text>
                </View>
                {drainSpeed === key && <Ionicons name="checkmark-circle" size={24} color="#6C3CE1" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Grace Period */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>⏳ Grace period</Text>
            <Text style={styles.stepSubtitle}>How long after activation before the drain starts?</Text>

            <View style={styles.presetRow}>
              {GRACE_PRESETS.map(g => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.presetChip, gracePeriod === g.value && styles.presetChipActive]}
                  onPress={() => setGracePeriod(g.value)}
                >
                  <Text style={[styles.presetText, gracePeriod === g.value && styles.presetTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Charity */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>🏛️ Where does it go?</Text>
            <OrgSelector selectedOrg={selectedOrg} onSelect={setSelectedOrg} />
          </View>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>⚠️ Final confirmation</Text>
            <Text style={styles.stepSubtitle}>This is irreversible. Review your setup:</Text>

            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Deposit</Text>
                <Text style={styles.confirmValue}>${depositAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Drain Rate</Text>
                <Text style={styles.confirmValue}>{DRAIN_SPEED_PRESETS[drainSpeed].label}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Grace Period</Text>
                <Text style={styles.confirmValue}>{gracePeriod} min</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Charity</Text>
                <Text style={styles.confirmValue}>{selectedOrg?.name}</Text>
              </View>
              <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.confirmLabel}>Est. drain time</Text>
                <Text style={styles.confirmValue}>
                  {Math.round(depositAmount * 100 / DRAIN_SPEED_PRESETS[drainSpeed].rate)} min
                </Text>
              </View>
            </View>

            <Text style={styles.warningText}>
              ⚠️ Once activated, your money WILL drain if you don't study. There are no refunds. Only {'\n'}3 emergency pauses available.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
            step === 4 && styles.confirmButton,
          ]}
          onPress={step === 4 ? handleConfirm : () => { hapticMedium(); setStep(s => s + 1) }}
          disabled={!canProceed() || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {step === 4 ? '💀 Activate SkinUP' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0D0D1A' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  progressDots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D2D44',
  },
  dotActive: { backgroundColor: '#6C3CE1', width: 20 },
  stepTitle: {
    color: '#E8E8F0', fontSize: 26, fontWeight: '800', marginBottom: 8,
  },
  stepSubtitle: {
    color: '#9CA3AF', fontSize: 15, lineHeight: 22, marginBottom: 24,
  },
  presetRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap',
  },
  presetChip: {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2D2D44',
  },
  presetChipActive: {
    borderColor: '#6C3CE1', backgroundColor: 'rgba(108, 60, 225, 0.15)',
  },
  presetText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  presetTextActive: { color: '#6C3CE1' },
  customInput: {
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14,
    color: '#E8E8F0', fontSize: 16, borderWidth: 1, borderColor: '#2D2D44',
  },
  speedOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#2D2D44',
  },
  speedOptionActive: { borderColor: '#6C3CE1' },
  speedLabel: { color: '#E8E8F0', fontSize: 16, fontWeight: '600' },
  speedLabelActive: { color: '#6C3CE1' },
  speedDesc: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  confirmCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2D2D44',
  },
  confirmLabel: { color: '#9CA3AF', fontSize: 14 },
  confirmValue: { color: '#E8E8F0', fontSize: 14, fontWeight: '600' },
  warningText: {
    color: '#F59E0B', fontSize: 13, lineHeight: 20, textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row', padding: 20, gap: 12,
    borderTopWidth: 1, borderTopColor: '#1A1A2E',
  },
  backStepButton: {
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: '#1A1A2E',
  },
  backStepText: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
  nextButton: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 12,
    backgroundColor: '#6C3CE1',
  },
  nextButtonDisabled: { opacity: 0.4 },
  confirmButton: { backgroundColor: '#F43F5E' },
  nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
})
