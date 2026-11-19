import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'

const DEMOS = [
  { label: 'Administrador', email: 'admin@alertaja.com', senha: 'admin123' },
  { label: 'Cidadã (Maria)', email: 'maria@email.com', senha: 'maria123' },
]

export default function Login() {
  const { login, toast, loginMsg } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErr, setFieldErr] = useState({})

  const submit = async (e) => {
    e.preventDefault()
    const fe = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) fe.email = 'Informe um e-mail válido.'
    if (!senha) fe.senha = 'Informe a senha.'
    setFieldErr(fe)
    setError('')
    if (Object.keys(fe).length) return
    setBusy(true)
    try {
      const r = await Api.login(email.trim(), senha)
      login(r)
      toast(`Bem-vindo(a), ${r.nome.split(' ')[0]}!`)
      nav('/painel', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div className="login-logo" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56"><path d="M32 6 60 56H4Z" fill="#f97316" /><rect x="28.5" y="22" width="7" height="19" rx="2.5" fill="#0f172a" /><circle cx="32" cy="48" r="4" fill="#0f172a" /></svg>
        </div>
        <h1>Alerta<span>Já</span></h1>
        <p>Alertas de enchente e chuva forte para a sua região, em tempo real.</p>
      </div>

      <form className="card form" onSubmit={submit} noValidate>
        {loginMsg && <div className="notice notice-warn">{loginMsg}</div>}
        {error && <div className="notice notice-error" role="alert">{error}</div>}

        <label className="field">
          <span>E-mail</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" aria-invalid={!!fieldErr.email} />
          {fieldErr.email && <small className="field-error">{fieldErr.email}</small>}
        </label>

        <label className="field">
          <span>Senha</span>
          <div className="input-group">
            <input type={show ? 'text' : 'password'} autoComplete="current-password" value={senha}
              onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" aria-invalid={!!fieldErr.senha} />
            <button type="button" className="input-addon" onClick={() => setShow((s) => !s)}>{show ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          {fieldErr.senha && <small className="field-error">{fieldErr.senha}</small>}
        </label>

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <><span className="spinner spinner-sm" /> Entrando…</> : 'Entrar'}
        </button>

        <div className="demo">
          <span>Acesso de demonstração</span>
          <div className="chips">
            {DEMOS.map((d) => (
              <button type="button" key={d.email} className="chip" onClick={() => { setEmail(d.email); setSenha(d.senha); setError(''); setFieldErr({}) }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </form>
      <p className="login-foot">Projeto acadêmico FIAP — dados fictícios. Em emergência ligue 199 (Defesa Civil).</p>
    </div>
  )
}
