import { useNavigate } from 'react-router-dom'
import { nivelInfo } from '../format.js'
import { useApp } from '../context.jsx'

export function NivelBadge({ nivel, size }) {
  const n = nivelInfo(nivel)
  return (
    <span className={`badge badge-${n.cls} ${size === 'lg' ? 'badge-lg' : ''}`}>
      <span className="badge-dot" aria-hidden="true" />
      {n.label}
    </span>
  )
}

export function Tag({ children, tone = 'muted' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}

export function Spinner({ label = 'Carregando…' }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="sk sk-title" />
          <div className="sk sk-line" />
        </div>
      ))}
    </div>
  )
}

export function Empty({ icon = '📭', title, text }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null
  return (
    <div className={`errorbox ${error.kind === 'network' ? 'errorbox-net' : ''}`} role="alert">
      <span aria-hidden="true">{error.kind === 'network' ? '📡' : '⚠️'}</span>
      <div>
        <strong>{error.kind === 'network' ? 'Sem conexão com a API' : 'Não foi possível carregar'}</strong>
        <p>{error.kind === 'network' ? 'Verifique se o servidor da API está em execução e tente novamente.' : error.message}</p>
      </div>
      {onRetry && <button className="btn btn-sm btn-ghost" onClick={() => onRetry()}>Tentar de novo</button>}
    </div>
  )
}

export function Header({ title, subtitle, back, right }) {
  const nav = useNavigate()
  return (
    <header className="appbar">
      {back ? (
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav(-1)}>‹</button>
      ) : (
        <span className="appbar-logo" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="26" height="26"><path d="M32 8 58 54H6Z" fill="#f97316" /><rect x="29" y="22" width="6" height="17" rx="2" fill="#0f172a" /><circle cx="32" cy="46" r="3.5" fill="#0f172a" /></svg>
        </span>
      )}
      <div className="appbar-title">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {right}
    </header>
  )
}

export function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span aria-hidden="true">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function OfflineBanner({ onRetry }) {
  const { offline } = useApp()
  if (!offline) return null
  return (
    <div className="offline-banner" role="alert">
      <span>📡 Sem conexão com a API</span>
      <button onClick={onRetry}>Tentar novamente</button>
    </div>
  )
}

export function ConfirmDialog({ open, title, text, confirmLabel = 'Confirmar', danger, busy, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <div className="dialog">
        <h2 id="dlg-title">{title}</h2>
        <p>{text}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Mini-gráfico das medições com as faixas de limite do sensor
export function Sparkline({ values, sensor, width = 280, height = 70 }) {
  if (!values.length) return null
  const max = Math.max(sensor.limitePerigo * 1.15, ...values)
  const min = 0
  const x = (i) => (values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - 8) + 4)
  const y = (v) => height - 4 - ((v - min) / (max - min)) * (height - 8)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const band = (from, to, cls) => (
    <rect x="0" width={width} y={y(to)} height={Math.max(0, y(from) - y(to))} className={`band band-${cls}`} />
  )
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Últimas ${values.length} medições`}>
      {band(sensor.limiteAtencao, sensor.limiteAlerta, 'atencao')}
      {band(sensor.limiteAlerta, sensor.limitePerigo, 'alerta')}
      {band(sensor.limitePerigo, max, 'perigo')}
      <polyline points={pts} fill="none" strokeWidth="2.5" className="spark-line" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4 : 2.2} className="spark-dot" />
      ))}
    </svg>
  )
}
