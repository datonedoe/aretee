import { Platform } from 'react-native'

export interface SpeechRecognitionCallbacks {
  onResult: (transcript: string) => void
  onPartial: (transcript: string) => void
  onEnd: () => void
  onError: (error: string) => void
}

let recognition: any = null
let isListening = false

export function isSpeechRecognitionAvailable(): boolean {
  if (Platform.OS !== 'web') return false
  return !!(
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  )
}

export function startListening(callbacks: SpeechRecognitionCallbacks): void {
  if (!isSpeechRecognitionAvailable()) {
    callbacks.onError('Speech recognition not available on this platform')
    return
  }

  if (isListening) {
    stopListening()
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onresult = (event: any) => {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) {
        finalTranscript += result[0].transcript
      } else {
        interimTranscript += result[0].transcript
      }
    }

    if (finalTranscript) {
      callbacks.onResult(finalTranscript)
    }
    if (interimTranscript) {
      callbacks.onPartial(interimTranscript)
    }
  }

  recognition.onerror = (event: any) => {
    isListening = false
    callbacks.onError(event.error || 'Speech recognition error')
  }

  recognition.onend = () => {
    isListening = false
    callbacks.onEnd()
  }

  try {
    recognition.start()
    isListening = true
  } catch {
    callbacks.onError('Failed to start speech recognition')
  }
}

export function stopListening(): void {
  if (recognition && isListening) {
    try {
      recognition.stop()
    } catch {
      // Already stopped
    }
    isListening = false
  }
}

export function isCurrentlyListening(): boolean {
  return isListening
}
