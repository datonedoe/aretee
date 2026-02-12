import { Platform } from 'react-native'

export interface PlayerStatus {
  isPlaying: boolean
  position: number // seconds
  duration: number // seconds
  isLoaded: boolean
}

export type StatusCallback = (status: PlayerStatus) => void

class AudioPlayer {
  private audio: HTMLAudioElement | null = null
  private statusCallback: StatusCallback | null = null
  private updateInterval: ReturnType<typeof setInterval> | null = null
  private playbackRate = 1.0

  async load(uri: string): Promise<void> {
    this.unload()

    if (Platform.OS === 'web') {
      this.audio = new Audio(uri)
      this.audio.playbackRate = this.playbackRate

      this.audio.addEventListener('loadedmetadata', () => {
        this.emitStatus()
      })

      this.audio.addEventListener('ended', () => {
        this.emitStatus()
      })

      this.audio.addEventListener('error', () => {
        this.emitStatus()
      })

      // Wait for the audio to be loadable
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) return reject(new Error('No audio element'))
        this.audio.addEventListener('canplay', () => resolve(), { once: true })
        this.audio.addEventListener('error', () => reject(new Error('Failed to load audio')), {
          once: true,
        })
        this.audio.load()
      })
    } else {
      // On native, use expo-av
      const { Audio } = require('expo-av') as typeof import('expo-av')
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      })
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, rate: this.playbackRate },
        (status: any) => {
          if (status.isLoaded) {
            this.statusCallback?.({
              isPlaying: status.isPlaying ?? false,
              position: (status.positionMillis ?? 0) / 1000,
              duration: (status.durationMillis ?? 0) / 1000,
              isLoaded: true,
            })
          }
        }
      )
      // Store as any since we need cross-platform polymorphism
      ;(this as any)._nativeSound = sound
    }
  }

  async play(): Promise<void> {
    if (Platform.OS === 'web') {
      if (!this.audio) return
      await this.audio.play()
      this.startUpdates()
    } else {
      const sound = (this as any)._nativeSound
      if (sound) await sound.playAsync()
    }
  }

  async pause(): Promise<void> {
    if (Platform.OS === 'web') {
      this.audio?.pause()
      this.stopUpdates()
      this.emitStatus()
    } else {
      const sound = (this as any)._nativeSound
      if (sound) await sound.pauseAsync()
    }
  }

  async stop(): Promise<void> {
    if (Platform.OS === 'web') {
      if (this.audio) {
        this.audio.pause()
        this.audio.currentTime = 0
      }
      this.stopUpdates()
      this.emitStatus()
    } else {
      const sound = (this as any)._nativeSound
      if (sound) await sound.stopAsync()
    }
  }

  async seekTo(seconds: number): Promise<void> {
    if (Platform.OS === 'web') {
      if (this.audio) {
        this.audio.currentTime = seconds
        this.emitStatus()
      }
    } else {
      const sound = (this as any)._nativeSound
      if (sound) await sound.setPositionAsync(seconds * 1000)
    }
  }

  async setSpeed(rate: number): Promise<void> {
    this.playbackRate = rate
    if (Platform.OS === 'web') {
      if (this.audio) {
        this.audio.playbackRate = rate
      }
    } else {
      const sound = (this as any)._nativeSound
      if (sound) await sound.setRateAsync(rate, true)
    }
  }

  getStatus(): PlayerStatus {
    if (Platform.OS === 'web' && this.audio) {
      return {
        isPlaying: !this.audio.paused && !this.audio.ended,
        position: this.audio.currentTime,
        duration: this.audio.duration || 0,
        isLoaded: this.audio.readyState >= 2,
      }
    }
    return { isPlaying: false, position: 0, duration: 0, isLoaded: false }
  }

  onStatus(callback: StatusCallback): void {
    this.statusCallback = callback
  }

  unload(): void {
    this.stopUpdates()
    if (Platform.OS === 'web') {
      if (this.audio) {
        this.audio.pause()
        this.audio.src = ''
        this.audio = null
      }
    } else {
      const sound = (this as any)._nativeSound
      if (sound) {
        sound.unloadAsync()
        ;(this as any)._nativeSound = null
      }
    }
  }

  private startUpdates(): void {
    this.stopUpdates()
    this.updateInterval = setInterval(() => this.emitStatus(), 250)
  }

  private stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  private emitStatus(): void {
    if (this.statusCallback) {
      this.statusCallback(this.getStatus())
    }
  }
}

// Singleton player instance
let playerInstance: AudioPlayer | null = null

export function getAudioPlayer(): AudioPlayer {
  if (!playerInstance) {
    playerInstance = new AudioPlayer()
  }
  return playerInstance
}
