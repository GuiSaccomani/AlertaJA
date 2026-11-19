import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { clearSession, getSession, onApiEvent, saveSession } from './api.js'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [session, setSession] = useState(() => getSession())
  const [toasts, setToasts] = useState([])
  const [offline, setOffline] = useState(false)
  const [loginMsg, setLoginMsg] = useState('')
  const idRef = useRef(0)

  const toast = useCallback((message, type = 'success') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const login = useCallback((s) => {
    saveSession(s)
    setSession(s)
    setLoginMsg('')
  }, [])

  const logout = useCallback((msg = '') => {
    clearSession()
    setSession(null)
    setLoginMsg(msg)
  }, [])

  useEffect(() => {
    const offUnauth = onApiEvent('unauthorized', () => logout('Sua sessão expirou. Entre novamente.'))
    const offNet = onApiEvent('network', (err) => setOffline(!!err))
    return () => { offUnauth(); offNet() }
  }, [logout])

  const value = useMemo(() => ({
    session,
    isAdmin: session?.role === 'ROLE_ADMIN',
    login,
    logout,
    toast,
    toasts,
    offline,
    setOffline,
    loginMsg,
  }), [session, login, logout, toast, toasts, offline, loginMsg])

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  return useContext(AppCtx)
}
