import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import VoiceVisualizer from '../components/VoiceVisualizer.jsx'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js'
import { getApiErrorMessage, getInterview, submitInterviewAnswer } from '../services/api.js'

export default function InterviewRoom() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Current Question & Feedback state
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [lastFeedback, setLastFeedback] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Text response
  const [textAnswer, setTextAnswer] = useState('')
  const [inputMode, setInputMode] = useState('voice') // 'voice' or 'text'

  const handleTranscript = useCallback((newText) => {
    setTextAnswer(newText)
  }, [])

  // Voice Hooks
  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: sttSupported,
  } = useSpeechRecognition({ onTranscript: handleTranscript })

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isMuted,
    toggleMute,
    rate,
    setRate,
  } = useSpeechSynthesis()

  const autoSpeakRef = useRef(true)

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      stopSpeaking()
      startListening()
    }
  }, [isListening, stopListening, stopSpeaking, startListening])

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load session data
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const data = await getInterview(id)
        if (cancelled) return

        setSession(data)
        if (data.status === 'completed') {
          navigate(`/interview/${id}/report`)
          return
        }

        if (data.current_question) {
          setCurrentQuestion(data.current_question)
          // Speak initial question if enabled
          const voicePref = sessionStorage.getItem('voice_mode_enabled') !== 'false'
          if (voicePref && autoSpeakRef.current) {
            setTimeout(() => {
              speak(data.current_question.question_text)
            }, 500)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load interview session.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
      stopSpeaking()
      stopListening()
    }
  }, [id, navigate, speak, stopSpeaking, stopListening])

  // Handle Answer Submission
  const handleSubmitAnswer = async () => {
    const finalAnswer = textAnswer.trim()
    if (!finalAnswer) {
      setError('Please provide an answer before submitting (speak or type).')
      return
    }

    stopSpeaking()
    stopListening()

    try {
      setSubmitting(true)
      setError(null)

      const result = await submitInterviewAnswer(id, finalAnswer)
      setLastFeedback(result.feedback)
      // Do not block screen with modal automatically; show feedback in the side panel

      // Clear answer inputs for next question
      setTextAnswer('')
      resetTranscript()

      if (result.is_completed) {
        // All questions completed! Navigate immediately to report
        navigate(`/interview/${id}/report`)
      } else if (result.next_question) {
        setCurrentQuestion(result.next_question)

        // Read out next question quickly if voice enabled
        const voicePref = sessionStorage.getItem('voice_mode_enabled') !== 'false'
        if (voicePref && !isMuted) {
          setTimeout(() => {
            speak(result.next_question.question_text)
          }, 300)
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit response. Please retry.'))
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading interview room...</p>
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            <h2 className="text-lg font-semibold">Error Loading Interview</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{session?.job_role}</span>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30 uppercase">
                  {session?.interview_type}
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {session?.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Question {currentQuestion?.question_number || 1} of {session?.question_count}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span>⏱️ Timer:</span>
              <span className="font-mono font-medium text-white">{formatTime(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to end this interview? Your progress will be saved.')) {
                  navigate(`/interview/${id}/report`)
                }
              }}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
            style={{
              width: `${((currentQuestion?.question_number || 1) / (session?.question_count || 1)) * 100}%`,
            }}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* LEFT: AI Interviewer Persona & Question Station (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 to-slate-900/60 p-6 backdrop-blur">
              {/* Interviewer Persona Card */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/30">
                    AI
                    {isSpeaking && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">AI Interviewer</h3>
                    <p className="text-xs text-slate-400">
                      {isSpeaking ? 'Speaking question...' : 'Listening to your response'}
                    </p>
                  </div>
                </div>

                {/* Speech rate & mute controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRate((r) => (r === 1.0 ? 1.2 : r === 1.2 ? 0.85 : 1.0))}
                    className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
                    title="Change speaking speed"
                  >
                    {rate}x
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`rounded-lg p-1.5 text-xs transition ${
                      isMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>

              {/* Soundwave Visualizer */}
              <div className="mt-4">
                <VoiceVisualizer isActive={isSpeaking} mode="interviewer" barCount={20} />
              </div>

              {/* Current Question Body */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                    Topic:
                  </span>
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300 border border-indigo-500/20">
                    {currentQuestion?.topic || 'General Competency'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 text-sm leading-relaxed text-slate-100 font-medium">
                  {currentQuestion?.question_text}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {isSpeaking ? (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-medium transition"
                    >
                      <span>⏹️ Skip Voice (Ready to Answer)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => speak(currentQuestion?.question_text)}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <span>🔄 Replay Question Audio</span>
                    </button>
                  )}

                  <span className="text-[11px] text-slate-500">
                    Level: {currentQuestion?.difficulty_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Previous Feedback Drawer (if available) */}
            {lastFeedback && (
              <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-5 backdrop-blur space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <span>💡 Answer Coaching & Feedback</span>
                  </h4>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      lastFeedback.score >= 8
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : lastFeedback.score >= 6
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    Score: {lastFeedback.score} / 10
                  </span>
                </div>

                {/* Diagnosis of what was missing / wrong */}
                {lastFeedback.what_was_missing_or_incorrect && (
                  <div className="rounded-xl bg-amber-950/20 border border-amber-500/30 p-3 text-xs">
                    <span className="font-semibold text-amber-400 block mb-1">
                      ⚠️ Why your answer was incomplete or off-track:
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {lastFeedback.what_was_missing_or_incorrect}
                    </p>
                  </div>
                )}

                {/* How to say it in the right way */}
                <div className="rounded-xl bg-indigo-950/30 border border-indigo-500/30 p-3 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-indigo-300">
                      🎯 How to Say It in the Right Way:
                    </span>
                    <button
                      type="button"
                      onClick={() => speak(lastFeedback.how_to_say_it_right || lastFeedback.model_answer)}
                      className="flex items-center gap-1 rounded-md bg-indigo-600/30 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-600/50 transition"
                      title="Listen to the ideal spoken response"
                    >
                      <span>🔊 Listen</span>
                    </button>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-[11px] italic">
                    {lastFeedback.how_to_say_it_right || lastFeedback.model_answer}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View detailed rubric & phrasing guide →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Candidate Response Station (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-white">Your Response</h3>
                  <p className="text-xs text-slate-400">
                    Speak using your microphone or type your response directly.
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setInputMode('voice')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      inputMode === 'voice'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🎙️ Voice Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('text')
                      stopListening()
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      inputMode === 'text'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⌨️ Text Mode
                  </button>
                </div>
              </div>

              {/* VOICE MODE INTERFACE */}
              {inputMode === 'voice' && (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    {/* Microphone Circle Button */}
                    <div className="relative mb-4">
                      {isListening && (
                        <div className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-ping" />
                      )}
                      <button
                        type="button"
                        onClick={handleMicToggle}
                        className={`relative flex h-20 w-20 items-center justify-center rounded-full text-2xl transition shadow-xl ${
                          isListening
                            ? 'bg-rose-600 text-white shadow-rose-600/40 hover:bg-rose-500'
                            : 'bg-emerald-600 text-white shadow-emerald-600/40 hover:bg-emerald-500'
                        }`}
                      >
                        {isListening ? '⏹️' : '🎙️'}
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-white">
                      {isListening ? 'Recording your voice... Click to Stop' : 'Click microphone to start speaking'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {sttSupported
                        ? 'Speak clearly into your microphone. Words are transcribed in real time.'
                        : 'Browser speech recognition not detected. You can type your answer below.'}
                    </p>

                    {/* Microphone Waveform Visualizer */}
                    <div className="mt-4 w-full max-w-xs">
                      <VoiceVisualizer isActive={isListening} mode="candidate" barCount={18} />
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Answer Transcript & Text Input */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="answer-input" className="text-xs font-semibold text-slate-300">
                    Live Response Transcript (Editable):
                  </label>
                  {textAnswer && (
                    <button
                      type="button"
                      onClick={() => {
                        setTextAnswer('')
                        resetTranscript()
                      }}
                      className="text-[11px] text-slate-500 hover:text-rose-400"
                    >
                      Clear text
                    </button>
                  )}
                </div>

                <textarea
                  id="answer-input"
                  rows={6}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={
                    inputMode === 'voice'
                      ? 'Your spoken answer will appear here in real time. You can also edit it before submitting...'
                      : 'Type your comprehensive response to the interview question here...'
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                />

                {interimTranscript && (
                  <p className="mt-1.5 text-xs text-slate-400 italic">
                    Listening: <span className="text-emerald-400">{interimTranscript}</span>
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Word count: {textAnswer.trim().split(/\s+/).filter(Boolean).length}</span>
                  <span>Tip: Elaborate on specific examples and quantifiable outcomes.</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {currentQuestion?.question_number === session?.question_count
                  ? 'Last Question'
                  : `Next: Question ${(currentQuestion?.question_number || 1) + 1}`}
              </span>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submitting || !textAnswer.trim()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Evaluating with NLP...
                  </>
                ) : (
                  <>Submit Answer →</>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal for In-Depth Feedback on Prior Question */}
      {showFeedbackModal && lastFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-w-xl w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Question Evaluation Rubric</h3>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Score & Recovery Tip Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Response Score:</span>
                  <div className="text-2xl font-bold text-white">{lastFeedback.score} / 10</div>
                </div>
                {lastFeedback.recovery_tip && (
                  <div className="text-left max-w-sm rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-2.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-0.5">
                      💡 Interview Recovery Advice:
                    </span>
                    <p className="text-[11px] text-slate-300 leading-snug">{lastFeedback.recovery_tip}</p>
                  </div>
                )}
              </div>

              {/* Diagnosis of What was Missing or Wrong */}
              {lastFeedback.what_was_missing_or_incorrect && (
                <div className="rounded-xl bg-amber-950/30 border border-amber-500/30 p-4 text-xs">
                  <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <span>⚠️ Diagnosis: What Was Missing or Incorrect</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {lastFeedback.what_was_missing_or_incorrect}
                  </p>
                </div>
              )}

              {/* HOW TO SAY IT IN THE RIGHT WAY - Highlighted Card */}
              <div className="rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/40 p-4 text-xs shadow-md">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20">
                  <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <span>🎯 How to Say It in the Right Way (Spoken Script)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => speak(lastFeedback.how_to_say_it_right || lastFeedback.model_answer)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition"
                  >
                    <span>🔊 Listen to Answer</span>
                  </button>
                </div>
                <p className="text-slate-100 leading-relaxed italic text-xs">
                  {lastFeedback.how_to_say_it_right || lastFeedback.model_answer}
                </p>
              </div>

              {/* PHRASING GUIDE / SENTENCE STARTERS */}
              {lastFeedback.phrasing_guide && lastFeedback.phrasing_guide.length > 0 && (
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs">
                  <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                    <span>📝 Phrasing & Structure Formulas to Memorize:</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {lastFeedback.phrasing_guide.map((phrase, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dimensional Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Technical Accuracy</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {lastFeedback.criteria_scores?.technical_accuracy} / 10
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Communication</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {lastFeedback.criteria_scores?.clarity_and_communication} / 10
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Completeness</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {lastFeedback.criteria_scores?.completeness} / 10
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">STAR Structure</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {lastFeedback.criteria_scores?.structure} / 10
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3">
                  <h4 className="font-semibold text-emerald-400 mb-1">Key Strengths:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {lastFeedback.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-3">
                  <h4 className="font-semibold text-amber-400 mb-1">Areas for Improvement:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {lastFeedback.improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Continue Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
