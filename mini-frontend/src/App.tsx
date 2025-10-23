import { useEffect, useState } from 'react'
import { checkSession, loginWithECW, logout } from './api'
import { Login } from './components/Login'
import MainApp from './MainApp'

export default function App() {
  const [auth, setAuth] = useState<boolean | null>(null)

  const check = async () => {
    try {
      const s = await checkSession()
      setAuth(!!s.authenticated)
    } catch {
      setAuth(false)
    }
  }

  useEffect(() => {
    check()
    
    // If ?auth=ok, refresh session and clean URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'ok') {
      check()
      params.delete('auth')
      const url = new URL(window.location.href)
      url.search = params.toString()
      window.history.replaceState({}, '', url.toString())
    }
    
    // Re-check session on window focus
    const onFocus = () => check()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Loading state
  if (auth === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!auth) {
    return <Login onLogin={loginWithECW} />
  }

  // Authenticated - show main app
  return <MainApp onLogout={logout} />
}
