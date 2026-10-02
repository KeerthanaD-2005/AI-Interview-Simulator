import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [rate, setRate] = useState(1.1)
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  })
  const [voices, setVoices] = useState([])
  const selectedVoiceRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)

        // Select preferred natural English voice
        const englishVoice = availableVoices.find(
          (v) =>
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Guy') || v.name.includes('Jenny')) &&
            v.lang.startsWith('en')
        ) || availableVoices.find((v) => v.lang.startsWith('en'))

        selectedVoiceRef.current = englishVoice || availableVoices[0] || null
      }

      updateVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices
      }
    } else {
      setIsSupported(false)
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(
    (text, onEnd) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted || !text) {
        if (onEnd) onEnd()
        return
      }

      window.speechSynthesis.cancel()

      const cleanText = text.replace(/[*_#`]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = rate
      utterance.pitch = 1.0

      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        if (onEnd) onEnd()
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        if (onEnd) onEnd()
      }

      window.speechSynthesis.speak(utterance)
    },
    [isMuted, rate]
  )

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        stop()
      }
      return !prev
    })
  }, [stop])

  return {
    speak,
    stop,
    isSpeaking,
    isMuted,
    toggleMute,
    rate,
    setRate,
    isSupported,
    voices,
  }
}
