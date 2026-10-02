import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const features = [
  {
    icon: '🎙️',
    title: 'Two-Way Voice Communication',
    description:
      'Speak naturally using your microphone with real-time Speech-to-Text, and listen to the AI Interviewer speak questions via Text-to-Speech.',
  },
  {
    icon: '🎯',
    title: 'Any Job Role Supported',
    description:
      'Prepare for Software Engineer, ML Engineer, Data Analyst, Product Manager, DevOps, or any custom role with zero restrictions.',
  },
  {
    icon: '🧠',
    title: 'Prompt Engineering & NLP Scoring',
    description:
      'Every answer is evaluated across Technical Accuracy, Communication Clarity, Depth, and STAR framework structure with constructive coaching.',
  },
  {
    icon: '⚡',
    title: 'Dynamic Adaptive Questioning',
    description:
      'The AI dynamically adapts to your responses—probing deeper when you excel and asking clarifying fundamentals if you struggle.',
  },
  {
    icon: '📊',
    title: 'Detailed Performance Analytics',
    description:
      'Receive an executive readiness verdict, dimensional score radar, identified strengths, growth areas, and model exemplary answers.',
  },
  {
    icon: '📁',
    title: 'Session History & Progress Tracking',
    description:
      'Review all your past interviews, revisit transcripts, track your readiness scores over time, and practice again.',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              Next-Gen Voice-Powered AI Interview Simulation
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-tight">
              Master interviews for <span className="text-indigo-400">any role</span> through live voice conversation.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Practice Technical, HR, Behavioral, and System Design interviews with an interactive AI interviewer. Speak naturally with real-time speech recognition and get instant NLP evaluations and coaching.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={isAuthenticated ? '/interview/setup' : '/register'}
                className="rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 transition hover:scale-105"
              >
                🎙️ Start Voice Interview Now →
              </Link>
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-slate-800/80 bg-slate-900/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Comprehensive Interview Simulation Platform
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Engineered with dynamic prompt reasoning, speech synthesis, real-time transcription, and multi-criteria NLP evaluation.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur transition hover:border-slate-700 hover:bg-slate-900/50"
                >
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-500">
          AI Interview Simulator • Voice & NLP Interview Platform
        </div>
      </footer>
    </div>
  )
}
