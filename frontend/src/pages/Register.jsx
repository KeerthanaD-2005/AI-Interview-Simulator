import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { getApiErrorMessage, registerUser } from '../services/api.js'

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password must match.')
      return
    }

    setSubmitting(true)
    try {
      const data = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      navigate('/login', {
        replace: true,
        state: {
          message: data.message || 'Account created successfully. Please log in.',
        },
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto flex max-w-6xl justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/50 p-8"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-white">Create account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Register to start practicing interviews in later steps.
          </p>

          {error ? (
            <p className="mt-4 rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          ) : null}

          <label className="mt-6 block text-sm font-medium text-slate-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
            placeholder="Test User"
          />

          <label className="mt-4 block text-sm font-medium text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
            placeholder="you@example.com"
          />

          <label className="mt-4 block text-sm font-medium text-slate-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          />

          <label className="mt-4 block text-sm font-medium text-slate-300" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-300 hover:text-indigo-200">
              Login
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}

export default Register
