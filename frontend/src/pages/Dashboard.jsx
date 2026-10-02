import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getApiErrorMessage, getInterviewHistory } from '../services/api.js'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [historyData, setHistoryData] = useState({
    sessions: [],
    total_completed: 0,
    average_score: null,
    top_roles: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchHistory() {
      try {
        setLoading(true)
        setError(null)
        const data = await getInterviewHistory()
        if (!cancelled) {
          setHistoryData(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to fetch interview history.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHistory()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome & Launch Hero */}
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950 p-8 shadow-xl backdrop-blur">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Welcome back
            </span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Hello, {user?.name || 'Candidate'} 👋
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              Ready to practice? Launch an AI interview for any target job role with full voice communication, real-time rubric evaluation, and personalized feedback.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate('/interview/setup')}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 transition hover:scale-105"
            >
              <span>🎙️ Start New Interview</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <span className="text-xs font-medium text-slate-400">Interviews Completed</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {historyData.total_completed}
              </span>
              <span className="text-xs text-slate-500">sessions</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Full practice sessions with performance rubrics
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <span className="text-xs font-medium text-slate-400">Average Performance</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-400">
                {historyData.average_score !== null ? `${Math.round(historyData.average_score)}%` : '—'}
              </span>
              <span className="text-xs text-slate-500">overall readiness</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Aggregated across technical, clarity & problem-solving
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <span className="text-xs font-medium text-slate-400">Practiced Domains</span>
            <div className="mt-2">
              {historyData.top_roles && historyData.top_roles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {historyData.top_roles.map((r, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm font-semibold text-slate-400">None yet</span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Most frequently prepared job roles
            </p>
          </div>
        </div>

        {/* Recent Interviews History Table / Cards */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Your Interview History</h2>
              <p className="text-xs text-slate-400">Review past practice sessions and detailed analytics</p>
            </div>

            <Link
              to="/interview/setup"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              + New Interview
            </Link>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
              {error}
            </div>
          ) : historyData.sessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-400">
                🎙️
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">No interviews completed yet</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Configure your target role and start your first voice interview simulation to get instant AI evaluation and coaching.
              </p>
              <button
                type="button"
                onClick={() => navigate('/interview/setup')}
                className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                Configure First Interview
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {historyData.sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur transition hover:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-base font-bold text-indigo-400">
                      AI
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{sess.job_role}</span>
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20 uppercase">
                          {sess.interview_type}
                        </span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          {sess.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {sess.answered_questions} of {sess.question_count} questions answered •{' '}
                        {new Date(sess.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {sess.overall_score !== null ? (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Overall Score</span>
                        <span
                          className={`text-sm font-bold ${
                            sess.overall_score >= 80
                              ? 'text-emerald-400'
                              : sess.overall_score >= 65
                              ? 'text-indigo-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {Math.round(sess.overall_score)}%
                        </span>
                      </div>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-300 border border-amber-500/20">
                        In Progress
                      </span>
                    )}

                    <Link
                      to={sess.status === 'completed' ? `/interview/${sess.id}/report` : `/interview/${sess.id}`}
                      className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                    >
                      {sess.status === 'completed' ? 'View Report →' : 'Resume →'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
