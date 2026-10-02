import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js'
import { getApiErrorMessage, getInterview } from '../services/api.js'

export default function InterviewReport() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedIndex, setExpandedIndex] = useState(0)

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis()

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const data = await getInterview(id)
        if (!cancelled) {
          setSession(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load interview report.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Compiling performance analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            <h2 className="text-lg font-semibold">Report Not Found</h2>
            <p className="mt-2 text-sm">{error || 'Session could not be located.'}</p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const report = session.summary_report || {}
  const overallScore = session.overall_score || report.overall_score || 0
  const dimensionalScores = report.dimensional_scores || {
    technical_knowledge: overallScore,
    communication_clarity: overallScore,
    depth_and_completeness: overallScore,
    problem_solving_structure: overallScore,
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    if (score >= 65) return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10'
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="text-xs text-indigo-400 hover:text-indigo-300">
                Dashboard
              </Link>
              <span className="text-xs text-slate-600">/</span>
              <span className="text-xs text-slate-400">Interview Evaluation Report</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              Performance Analytics & Report
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Target Role: <strong className="text-white">{session.job_role}</strong> • {session.experience_level} • {session.interview_type}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/interview/setup')}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition"
            >
              + Practice Another Role
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Executive Score & Readiness Card */}
        <div className="mt-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 shadow-xl backdrop-blur">
          <div className="grid gap-8 md:grid-cols-12 items-center">
            {/* Score Ring */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-6 md:pb-0 md:pr-6">
              <div className={`relative flex h-36 w-36 items-center justify-center rounded-full border-4 ${getScoreColor(overallScore)}`}>
                <div>
                  <div className="text-4xl font-extrabold text-white">{Math.round(overallScore)}%</div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Overall Score</div>
                </div>
              </div>

              <div className="mt-4">
                <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {report.readiness_verdict || 'Candidate Evaluation Complete'}
                </span>
              </div>
            </div>

            {/* Summary Text & Dimensional Bars */}
            <div className="md:col-span-8 space-y-5">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Executive Assessment
                </h3>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  {report.summary || 'Responses evaluated based on technical mastery, communication clarity, problem-solving depth, and answer structure.'}
                </p>
              </div>

              {/* Dimensional Metric Bars */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Technical Knowledge & Terminology</span>
                    <span className="text-white font-bold">{Math.round(dimensionalScores.technical_knowledge || overallScore)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(100, Math.max(10, dimensionalScores.technical_knowledge || overallScore))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Communication Clarity & Articulation</span>
                    <span className="text-white font-bold">{Math.round(dimensionalScores.communication_clarity || overallScore)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(10, dimensionalScores.communication_clarity || overallScore))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Depth & Completeness</span>
                    <span className="text-white font-bold">{Math.round(dimensionalScores.depth_and_completeness || overallScore)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, Math.max(10, dimensionalScores.depth_and_completeness || overallScore))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Problem-Solving & STAR Structure</span>
                    <span className="text-white font-bold">{Math.round(dimensionalScores.problem_solving_structure || overallScore)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${Math.min(100, Math.max(10, dimensionalScores.problem_solving_structure || overallScore))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Growth Areas Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Key Strengths */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-6 backdrop-blur">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <span>✓ Key Demonstrated Strengths</span>
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              {(report.key_strengths || ['Clear communication', 'Relevant technical concepts cited']).map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Areas */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-6 backdrop-blur">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <span>△ Priority Growth Areas & Coaching</span>
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              {(report.growth_areas || ['Provide concrete metrics', 'Structure using STAR']).map((g, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Question-by-Question Detailed Review */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-white mb-4">
            Question-by-Question Review & Model Answers
          </h2>

          <div className="space-y-4">
            {session.questions.map((q, idx) => {
              const isExpanded = expandedIndex === idx
              const qScore = q.score ? Math.round(q.score * 10) : 60
              const fb = q.feedback || {}

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition"
                >
                  {/* Header clickable */}
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-white">
                        Q{q.question_number}
                      </span>
                      <div>
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30 uppercase mr-2">
                          {q.topic}
                        </span>
                        <p className="text-sm font-semibold text-white mt-1 line-clamp-1">
                          {q.question_text}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getScoreColor(qScore)}`}>
                        {qScore}%
                      </span>
                      <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-6 border-t border-slate-800 space-y-4 bg-slate-950/40">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Full Interview Question:
                        </h4>
                        <p className="mt-1 text-sm text-white font-medium">{q.question_text}</p>
                      </div>

                      {/* Candidate Answer */}
                      <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Your Spoken / Submitted Response:
                        </h4>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed italic">
                          "{q.user_answer || 'No response recorded'}"
                        </p>
                      </div>

                      {/* Diagnosis of What was Missing or Suboptimal */}
                      {fb.what_was_missing_or_incorrect && (
                        <div className="rounded-xl bg-amber-950/20 border border-amber-500/30 p-4 text-xs">
                          <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                            <span>⚠️ Diagnosis: Why this answer was incomplete or off-track</span>
                          </h4>
                          <p className="text-slate-300 leading-relaxed text-xs">
                            {fb.what_was_missing_or_incorrect}
                          </p>
                        </div>
                      )}

                      {/* HOW TO SAY IT IN THE RIGHT WAY - Highlighted Spoken Script Card */}
                      <div className="rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/40 p-4 text-xs shadow-md">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20">
                          <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                            <span>🎯 How to Say It in the Right Way (Ideal Spoken Response)</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => speak(fb.how_to_say_it_right || fb.model_answer)}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition"
                          >
                            <span>🔊 Listen to Answer</span>
                          </button>
                        </div>
                        <p className="text-slate-100 leading-relaxed italic text-xs">
                          {fb.how_to_say_it_right || fb.model_answer}
                        </p>
                      </div>

                      {/* Phrasing & Structure Formulas */}
                      {fb.phrasing_guide && fb.phrasing_guide.length > 0 && (
                        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs">
                          <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                            <span>📝 Phrasing Starters to Memorize & Practice:</span>
                          </h4>
                          <ul className="space-y-1.5 text-slate-300">
                            {fb.phrasing_guide.map((phrase, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>{phrase}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Live Interview Recovery Advice */}
                      {fb.recovery_tip && (
                        <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs">
                          <span className="font-bold text-indigo-300 block mb-1">
                            💡 Live Interview Recovery Tip:
                          </span>
                          <p className="text-slate-300 leading-relaxed text-xs">
                            {fb.recovery_tip}
                          </p>
                        </div>
                      )}

                      {/* Criteria Scores */}
                      {fb.criteria_scores && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-center">
                            <span className="text-slate-400 block text-[10px]">Technical Accuracy</span>
                            <span className="font-bold text-white">{fb.criteria_scores.technical_accuracy} / 10</span>
                          </div>
                          <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-center">
                            <span className="text-slate-400 block text-[10px]">Communication</span>
                            <span className="font-bold text-white">{fb.criteria_scores.clarity_and_communication} / 10</span>
                          </div>
                          <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-center">
                            <span className="text-slate-400 block text-[10px]">Completeness</span>
                            <span className="font-bold text-white">{fb.criteria_scores.completeness} / 10</span>
                          </div>
                          <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-center">
                            <span className="text-slate-400 block text-[10px]">Structure & Reasoning</span>
                            <span className="font-bold text-white">{fb.criteria_scores.structure} / 10</span>
                          </div>
                        </div>
                      )}

                      {/* Strengths & Improvements */}
                      <div className="grid gap-3 sm:grid-cols-2 text-xs">
                        {fb.strengths && fb.strengths.length > 0 && (
                          <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-3">
                            <span className="text-emerald-400 font-semibold block mb-1">What went well:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                              {fb.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {fb.improvements && fb.improvements.length > 0 && (
                          <div className="rounded-lg bg-amber-950/20 border border-amber-500/20 p-3">
                            <span className="text-amber-400 font-semibold block mb-1">How to improve:</span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                              {fb.improvements.map((imp, i) => (
                                <li key={i}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
