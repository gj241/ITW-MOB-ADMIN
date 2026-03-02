import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { adminApi } from '../api/admin'

const AuthContext = createContext(null)

const IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

function getStoredAuth() {
  const token = sessionStorage.getItem('admin_token')
  if (!token) return null

  const payload = parseJwt(token)
  if (!payload) return null

  // Check expiry
  if (payload.exp * 1000 < Date.now()) {
    sessionStorage.removeItem('admin_token')
    return null
  }

  return { token, user: { id: payload.userId, email: payload.email, isAdmin: payload.isAdmin } }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth)
  const idleTimer = useRef(null)

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_token')
    setAuth(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await adminApi.login(email, password)
    const token = result.data.accessToken
    sessionStorage.setItem('admin_token', token)
    const payload = parseJwt(token)
    setAuth({ token, user: { id: payload.userId, email: payload.email, isAdmin: payload.isAdmin } })
  }, [])

  // Idle timeout — auto-logout after 15 min of no activity
  useEffect(() => {
    if (!auth) return

    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        logout()
        window.location.href = '/admin/login'
      }, IDLE_TIMEOUT_MS)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  }, [auth, logout])

  return (
    <AuthContext.Provider value={{ user: auth?.user || null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
