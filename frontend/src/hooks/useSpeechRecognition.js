import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechRecognition({ onTranscript } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  })

  const recognitionRef = useRef(null)
  const listeningStateRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        listeningStateRef.current = true
        setError(null)
      }

      recognition.onresult = (event) => {
        let currentInterim = ''
        let currentFinal = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i]
          if (item.isFinal) {
            currentFinal += item[0].transcript + ' '
          } else {
            currentInterim += item[0].transcript
          }
        }

        if (currentFinal) {
          const trimmed = currentFinal.trim()
          setTranscript((prev) => {
            const next = prev ? `${prev.trim()} ${trimmed}` : trimmed
            if (onTranscriptRef.current) {
              onTranscriptRef.current(next)
            }
            return next
          })
        }
        setInterimTranscript(currentInterim)
      }

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          setError(event.error)
        }
      }

      recognition.onend = () => {
        if (listeningStateRef.current) {
          try {
            recognition.start()
          } catch {
            setIsListening(false)
            listeningStateRef.current = false
          }
        } else {
          setIsListening(false)
          setInterimTranscript('')
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      listeningStateRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const startListening = useCallback(() => {
    setError(null)
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    try {
      listeningStateRef.current = true
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // recognition may already be active
    }
  }, [])

  const stopListening = useCallback(() => {
    listeningStateRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  }
}
