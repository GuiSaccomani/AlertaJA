import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context.jsx'
import { Api } from './api.js'
import { Logo, OfflineBanner, Toasts } from './components/ui.jsx'
import Login from './pages/Login.jsx'
import Painel from './pages/Painel.jsx'
import Alertas from './pages/Alertas.jsx'
import AlertaDetalhe from './pages/AlertaDetalhe.jsx'
import RegiaoDetalhe from './pages/RegiaoDetalhe.jsx'
import Cadastro from './pages/Cadastro.jsx'
import Perfil from './pages/Perfil.jsx'

function StatusBar() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="statusbar" aria-hidden="true">
      <span>{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="notch" />
      <span className="status-icons">
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" /><rect x="2" y="2" width="15" height="8" rx="1.5" /><rect x="22.5" y="4" width="2" height="4" rx="1" /></svg>
      </span>
    </div>
  )
}

const ICONES = {
  painel: <><path d="M5 21V8M9.5 21V4M14 21v-9M18.5 21v-6" /></>,
  alertas: <><path d="M12 4 2.8 19.5h18.4Z" /><path d="M12 10v4.5M12 17.2v.1" /></>,
  cadastro: <><path d="M12 5v14M5 12h14" /></>,
  perfil: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></>,
}

function TabBar() {
  const { isAdmin } = useApp()
  const tabs = [
    { to: '/painel', label: 'Painel', icon: ICONES.painel },
    { to: '/alertas', label: 'Alertas', icon: ICONES.alertas },
    ...(isAdmin ? [{ to: '/cadastro', label: 'Cadastro', icon: ICONES.cadastro }] : []),
    { to: '/perfil', label: 'Perfil', icon: ICONES.perfil },
  ]
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function Protected({ children, admin }) {
  const { session, isAdmin } = useApp()
  if (!session) return <Navigate to="/login" replace />
  if (admin && !isAdmin) return <Navigate to="/painel" replace />
  return children
}

function Legenda() {
  return (
    <aside className="stage-info">
      <Logo height={58} />
      <p className="stage-lede">Leituras de pluviômetros e de sensores de nível de rio, transformadas em aviso para quem mora perto da água.</p>
      <p className="stage-foot">Global Solution 2026/2, FIAP. Dados de sensores simulados.</p>
    </aside>
  )
}

function Shell() {
  const { session, setOffline } = useApp()
  const loc = useLocation()
  const [retryKey, setRetryKey] = useState(0)

  const retry = async () => {
    try {
      await Api.status()
      setOffline(false)
      setRetryKey((k) => k + 1)
    } catch { /* banner continua visível */ }
  }

  return (
    <div className="stage">
      <Legenda />
      <div className="phone">
        <div className="phone-screen">
          <StatusBar />
          <OfflineBanner onRetry={retry} />
          <main className="screen" key={retryKey}>
            <Routes>
              <Route path="/login" element={session ? <Navigate to="/painel" replace /> : <Login />} />
              <Route path="/painel" element={<Protected><Painel /></Protected>} />
              <Route path="/alertas" element={<Protected><Alertas /></Protected>} />
              <Route path="/alertas/:id" element={<Protected><AlertaDetalhe /></Protected>} />
              <Route path="/regioes/:id" element={<Protected><RegiaoDetalhe /></Protected>} />
              <Route path="/cadastro" element={<Protected admin><Cadastro /></Protected>} />
              <Route path="/perfil" element={<Protected><Perfil /></Protected>} />
              <Route path="*" element={<Navigate to={session ? '/painel' : '/login'} replace />} />
            </Routes>
          </main>
          {session && loc.pathname !== '/login' && <TabBar />}
          <Toasts />
          <div className="home-indicator" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
