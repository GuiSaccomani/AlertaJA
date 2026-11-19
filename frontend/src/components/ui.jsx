import { useNavigate } from 'react-router-dom'
import { nivelInfo } from '../format.js'
import { useApp } from '../context.jsx'

const ZONAS = ['NORMAL', 'ATENCAO', 'ALERTA', 'PERIGO']

// Logo oficial: uma versão para cada tema (o CSS mostra a certa)
export function Logo({ height = 40 }) {
  return (
    <span className="logo" style={{ height }} role="img" aria-label="AlertaJá">
      <img src="/logo-alertaja.png" alt="" className="logo-claro" height={height} />
      <img src="/logo-alertaja-escuro.png" alt="" className="logo-escuro" height={height} />
    </span>
  )
}

// Régua linimétrica: a régua listrada usada para medir a cheia de rios.
// A água sobe até a faixa do nível atual. É o elemento-assinatura do app.
export function Regua({ nivel, height = 168, animate = true }) {
  const n = nivelInfo(nivel)
  const W = 46
  const zona = height / 4
  const agua = Math.min(height, (n.ordem + 0.62) * zona)
  return (
    <svg className={`regua ${animate ? 'regua-anim' : ''}`} width={W} height={height} viewBox={`0 0 ${W} ${height}`}
      role="img" aria-label={`Régua de nível: ${n.label}`}>
      <rect x="0" y="0" width={W} height={height} rx="3" className="regua-fundo" />
      <g className="regua-agua">
        <rect x="0.5" y={height - agua} width={W - 1} height={agua - 0.5} className="agua-corpo" />
      </g>
      {ZONAS.map((z, i) => {
        const yBase = height - i * zona
        const cls = nivelInfo(z).cls
        return (
          <g key={z} className={`regua-zona z-${cls}`}>
            <rect x="5" y={yBase - zona + 1} width="7" height={zona - 2} />
            {[0, 1, 2, 3, 4].map((t) => (
              <rect key={t} x="12" y={yBase - (t + 1) * (zona / 5) + 1} width={t % 2 === 0 ? 18 : 10} height={zona / 10} />
            ))}
          </g>
        )
      })}
      <g className="regua-agua">
        <path d={`M0 ${height - agua} q ${W / 4} -4 ${W / 2} 0 t ${W / 2} 0`} className="agua-linha" />
      </g>
    </svg>
  )
}

// Versão mini da régua: 4 degraus preenchidos até o nível.
export function NivelBadge({ nivel }) {
  const n = nivelInfo(nivel)
  return (
    <span className={`marca marca-${n.cls}`}>
      <span className="marca-degraus" aria-hidden="true">
        {ZONAS.map((z, i) => <i key={z} className={i <= n.ordem ? 'on' : ''} />)}
      </span>
      {n.label}
    </span>
  )
}

export function Tag({ children, tone = 'muted' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}

export function Spinner({ label = 'Carregando' }) {
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
        <div key={i} className="skeleton-row"><div className="sk sk-title" /><div className="sk sk-line" /></div>
      ))}
    </div>
  )
}

export function Empty({ title, text }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null
  const rede = error.kind === 'network'
  return (
    <div className="errorbox" role="alert">
      <div>
        <strong>{rede ? 'A API não respondeu' : 'Não foi possível carregar'}</strong>
        <p>{rede ? 'Confira se o servidor da API está rodando e tente de novo.' : error.message}</p>
      </div>
      {onRetry && <button className="btn btn-sm btn-ghost" onClick={() => onRetry()}>Tentar de novo</button>}
    </div>
  )
}

export function Header({ title, subtitle, back, right }) {
  const nav = useNavigate()
  return (
    <header className="appbar">
      {back && (
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav(-1)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}
      <div className="appbar-title">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {right}
    </header>
  )
}

export function RefreshButton({ onClick }) {
  return (
    <button className="icon-btn" aria-label="Atualizar agora" title="Atualizar agora" onClick={onClick}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" /></svg>
    </button>
  )
}

export function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>)}
    </div>
  )
}

export function OfflineBanner({ onRetry }) {
  const { offline } = useApp()
  if (!offline) return null
  return (
    <div className="offline-banner" role="alert">
      <span>Sem conexão com a API. Os dados podem estar desatualizados.</span>
      <button onClick={onRetry}>Reconectar</button>
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
            {busy ? 'Excluindo…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Gráfico das últimas leituras sobre as faixas de risco do sensor
export function Sparkline({ values, sensor, width = 300, height = 84 }) {
  if (!values.length) return null
  const max = Math.max(sensor.limitePerigo * 1.15, ...values)
  const x = (i) => (values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - 10) + 5)
  const y = (v) => height - 4 - (v / max) * (height - 8)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${x(0)},${height} ${pts} ${x(values.length - 1)},${height}`
  const faixa = (de, ate, cls) => (
    <rect x="0" width={width} y={y(ate)} height={Math.max(0, y(de) - y(ate))} className={`faixa faixa-${cls}`} />
  )
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Últimas ${values.length} leituras`}>
      {faixa(sensor.limiteAtencao, sensor.limiteAlerta, 'atencao')}
      {faixa(sensor.limiteAlerta, sensor.limitePerigo, 'alerta')}
      {faixa(sensor.limitePerigo, max, 'perigo')}
      <polygon points={area} className="spark-area" />
      <polyline points={pts} fill="none" className="spark-line" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="4" className="spark-dot" />
    </svg>
  )
}
