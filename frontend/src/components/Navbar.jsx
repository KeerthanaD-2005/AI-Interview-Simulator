import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()

  const linkClass = ({ isActive }) =>
    `text-sm ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-sm font-semibold">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">AI Interview Simulator</p>
            <p className="text-xs text-slate-400">GenAI practice platform</p>
          </div>
        </Link>
        <nav className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-slate-400 hover:text-white"
              >
                Logout
              </button>
              {user?.name ? (
                <span className="hidden text-xs text-slate-500 sm:inline">{user.name}</span>
              ) : null}
            </>
          ) : (
            <>
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
