import { Platform } from 'react-native'

type SoundType = 'xp' | 'levelUp' | 'achievement'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = volume
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

function playXPSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  playTone(880, 0.1, 'sine', 0.1)
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.08), 80)
}

function playLevelUpSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.12), i * 120)
  })
}

function playAchievementSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  const notes = [659, 784, 1047, 1319] // E5 G5 C6 E6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'triangle', 0.1), i * 100)
  })
}

export function playSound(type: SoundType) {
  try {
    switch (type) {
      case 'xp': playXPSound(); break
      case 'levelUp': playLevelUpSound(); break
      case 'achievement': playAchievementSound(); break
    }
  } catch {
    // Silently fail if audio isn't available
  }
}
