import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { createInterview, getApiErrorMessage } from '../services/api.js'

const POPULAR_ROLES = [
  'Software Engineer',
  'Full Stack Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Product Manager',
  'Cloud Architect',
  'Cybersecurity Analyst',
  'UI/UX Designer',
  'Data Analyst',
]

const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher / Graduate', desc: 'Fundamentals, basic problem solving' },
  { value: 'junior', label: 'Junior (0-2 yrs)', desc: 'Implementation, core tools, debugging' },
  { value: 'mid', label: 'Mid-Level (2-5 yrs)', desc: 'System design, optimization, best practices' },
  { value: 'senior', label: 'Senior (5+ yrs)', desc: 'Architecture, trade-offs, leadership' },
]

const INTERVIEW_TYPES = [
  { value: 'technical', label: 'Technical', desc: 'Core domain skills, architecture, tools' },
  { value: 'behavioral', label: 'Behavioral (STAR)', desc: 'Real scenarios, teamwork, conflict resolution' },
  { value: 'hr', label: 'HR & Cultural Fit', desc: 'Motivation, career goals, company fit' },
  { value: 'system_design', label: 'System Design', desc: 'Scalability, distributed systems, storage' },
  { value: 'coding', label: 'Coding / Problem Solving', desc: 'Algorithms, data structures, edge cases' },
  { value: 'managerial', label: 'Managerial & Leadership', desc: 'Prioritization, mentorship, delivery' },
  { value: 'mixed', label: 'Mixed Comprehensive', desc: 'Combination of technical, design & behavioral' },
]

const DIFFICULTIES = [
  { value: 'adaptive', label: 'Adaptive (Dynamic)', badge: 'Recommended', desc: 'Adjusts question depth based on your live answers' },
  { value: 'easy', label: 'Easy', desc: 'Introductory level questions' },
  { value: 'medium', label: 'Medium', desc: 'Standard industry interview difficulty' },
  { value: 'hard', label: 'Hard', desc: 'Challenging edge cases and deep questions' },
]

export default function InterviewSetup() {
  const navigate = useNavigate()

  const [jobRole, setJobRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [showJd, setShowJd] = useState(false)
  const [experienceLevel, setExperienceLevel] = useState('mid')
  const [interviewType, setInterviewType] = useState('technical')
  const [difficulty, setDifficulty] = useState('adaptive')
  const [questionCount, setQuestionCount] = useState(3)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleStart = async (e) => {
    e.preventDefault()
    if (!jobRole.trim()) {
      setError('Please specify a job role to begin.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const data = await createInterview({
        job_role: jobRole.trim(),
        job_description: jobDescription.trim() || null,
        experience_level: experienceLevel,
        interview_type: interviewType,
        difficulty,
        question_count: Number(questionCount),
      })

      // Store preference for voice mode in session
      sessionStorage.setItem('voice_mode_enabled', voiceEnabled ? 'true' : 'false')

      navigate(`/interview/${data.id}`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to launch interview session.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Universal Role AI Simulator
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Configure Your AI Interview
          </h1>
          <p className="mt-2 text-base text-slate-400">
            Tailor the interview for <strong className="text-white">any role</strong> with dynamic AI-generated questions, real-time voice conversation, and NLP response evaluations.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-8">
          {/* 1. Job Role Input */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <label htmlFor="job-role" className="block text-base font-semibold text-white">
              1. Which role are you preparing for? <span className="text-indigo-400">*</span>
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Enter any role. The AI generates relevant domain questions dynamically without restrictions.
            </p>

            <div className="mt-4">
              <input
                id="job-role"
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Machine Learning Engineer, Cloud Architect, Product Manager..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                required
              />
            </div>

            {/* Role Chips */}
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                Quick Select Popular Roles:
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setJobRole(role)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      jobRole.toLowerCase() === role.toLowerCase()
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional JD toggle */}
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => setShowJd(!showJd)}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
              >
                <span>{showJd ? '− Remove' : '+ Add'} Specific Job Description / Posting (Optional)</span>
              </button>

              {showJd && (
                <div className="mt-3">
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job posting requirements, key skills, or description to tailor the interview topics directly..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Experience Level */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <h2 className="text-base font-semibold text-white">2. Experience Level</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setExperienceLevel(lvl.value)}
                  className={`flex flex-col text-left rounded-xl p-4 border transition ${
                    experienceLevel === lvl.value
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold text-white">{lvl.label}</span>
                  <span className="mt-1 text-xs text-slate-400 leading-relaxed">{lvl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Interview Type */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <h2 className="text-base font-semibold text-white">3. Interview Type</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setInterviewType(type.value)}
                  className={`flex flex-col text-left rounded-xl p-4 border transition ${
                    interviewType === type.value
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold text-white">{type.label}</span>
                  <span className="mt-1 text-xs text-slate-400 leading-relaxed">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Difficulty & Question Count */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
              <h2 className="text-base font-semibold text-white">4. Difficulty Level</h2>
              <div className="mt-4 space-y-2.5">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value)}
                    className={`w-full flex items-center justify-between text-left rounded-xl p-3 border transition ${
                      difficulty === diff.value
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-white">{diff.label}</span>
                      <p className="text-[11px] text-slate-400">{diff.desc}</p>
                    </div>
                    {diff.badge && (
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/30">
                        {diff.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">5. Session Length</h2>
                <p className="mt-1 text-xs text-slate-400">Select number of interview questions</p>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[3, 5, 7, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`rounded-xl py-3 text-center border font-semibold transition ${
                        questionCount === num
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="text-base">{num}</div>
                      <div className="text-[10px] font-normal text-slate-500">Qs</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice mode toggle */}
              <div className="mt-6 border-t border-slate-800 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-white flex items-center gap-1.5">
                      Enable Voice Communication 🎙️
                    </span>
                    <p className="text-[11px] text-slate-400">
                      AI speaks questions aloud and candidate can respond using the microphone.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generating Questions...
                </>
              ) : (
                'Start AI Interview →'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
