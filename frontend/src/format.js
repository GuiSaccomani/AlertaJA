export const NIVEIS = {
  NORMAL: { label: 'Normal', cls: 'normal', ordem: 0 },
  ATENCAO: { label: 'Atenção', cls: 'atencao', ordem: 1 },
  ALERTA: { label: 'Alerta', cls: 'alerta', ordem: 2 },
  PERIGO: { label: 'Perigo', cls: 'perigo', ordem: 3 },
}

export const ORIENTACAO = {
  NORMAL: 'Sem riscos identificados no momento.',
  ATENCAO: 'Fique atento às atualizações e evite áreas alagáveis.',
  ALERTA: 'Prepare-se: separe documentos e itens essenciais e acompanhe a Defesa Civil.',
  PERIGO: 'Procure local seguro e elevado. Em emergência ligue 199 (Defesa Civil) ou 193.',
}

export const STATUS_ALERTA = {
  ATIVO: 'Ativo',
  RESOLVIDO_AUTO: 'Resolvido automaticamente',
  RESOLVIDO_MANUAL: 'Resolvido manualmente',
}

export const TIPOS_SENSOR = {
  PLUVIOMETRO: 'Pluviômetro',
  NIVEL_AGUA: 'Nível da água',
}

export function nivelInfo(n) {
  return NIVEIS[n] || { label: n || '—', cls: 'normal', ordem: 0 }
}

export function nomeRegiao(r) {
  if (!r) return '—'
  return `${r.nome} — ${r.cidade}/${r.estado}`
}

function parse(d) {
  if (!d) return null
  const dt = new Date(d)
  if (isNaN(dt) || dt.getFullYear() < 1900) return null
  return dt
}

export function dataHora(d) {
  const dt = parse(d)
  if (!dt) return '—'
  return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function hora(d) {
  const dt = parse(d)
  if (!dt) return '—'
  return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function relativo(d) {
  const dt = parse(d)
  if (!dt) return '—'
  const s = Math.round((Date.now() - dt.getTime()) / 1000)
  if (s < 60) return 'agora mesmo'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  const dd = Math.round(h / 24)
  return `há ${dd} dia${dd > 1 ? 's' : ''}`
}

export function numero(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function classificar(valor, s) {
  if (valor >= s.limitePerigo) return 'PERIGO'
  if (valor >= s.limiteAlerta) return 'ALERTA'
  if (valor >= s.limiteAtencao) return 'ATENCAO'
  return 'NORMAL'
}
