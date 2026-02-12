import { Platform } from 'react-native'

type SoundType = 'xp' | 'levelUp' | 'achievement' | 'insight' | 'feynman' | 'podcast'

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

function playInsightSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  // Ascending arpeggio — magical discovery feel
  const notes = [440, 554, 659, 880, 1109] // A4 C#5 E5 A5 C#6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.1 - i * 0.015), i * 110)
  })
}

function playFeynmanSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  // Warm, confident chord — knowledge solidified
  const notes = [523, 659, 784, 1047, 1319] // C5 E5 G5 C6 E6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.35, 'triangle', 0.08 - i * 0.01), i * 90)
  })
}

function playPodcastSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  // Gentle completion chime — podcast finished
  const notes = [659, 784, 1047] // E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.1 - i * 0.02), i * 150)
  })
}

export function playSound(type: SoundType) {
  try {
    switch (type) {
      case 'xp': playXPSound(); break
      case 'levelUp': playLevelUpSound(); break
      case 'achievement': playAchievementSound(); break
      case 'insight': playInsightSound(); break
      case 'feynman': playFeynmanSound(); break
      case 'podcast': playPodcastSound(); break
    }
  } catch {
    // Silently fail if audio isn't available
  }
}
