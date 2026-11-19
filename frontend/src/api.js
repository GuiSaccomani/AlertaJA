// Wrapper único de acesso à API AlertaJá.
// Todas as chamadas usam caminhos relativos (/api/...) atendidos pelo proxy do Vite.
// A API Key (X-API-Key) NUNCA fica no frontend: medições são enviadas só pelo simulador IoT.

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'http', fields = null } = {}) {
    super(message)
    this.status = status
    this.kind = kind // 'network' | 'http'
    this.fields = fields // erros de validação por campo (ProblemDetails do ASP.NET)
  }
}

const SESSION_KEY = 'alertaja.session'

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s.expiraEm && new Date(s.expiraEm).getTime() < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

export function saveSession(s) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)) } catch { /* ignora */ }
}

export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignora */ }
}

// Eventos globais: sessão expirada (401) e estado da conexão
const listeners = { unauthorized: new Set(), network: new Set() }
export function onApiEvent(type, fn) {
  listeners[type].add(fn)
  return () => listeners[type].delete(fn)
}
function emit(type, payload) {
  listeners[type].forEach((fn) => fn(payload))
}

const MSG_REDE = 'Sem conexão com a API. Verifique se o servidor está em execução.'

function extractMessage(status, body) {
  if (body && typeof body === 'object') {
    if (body.mensagem) return body.mensagem
    if (body.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors).flat()[0]
      if (first) return first
    }
    if (body.title && status < 500) return body.title
  }
  if (typeof body === 'string' && body.trim() && body.length < 200 && status < 500) return body
  if (status === 400) return 'Dados inválidos. Revise os campos.'
  if (status === 401) return 'Sessão expirada ou não autenticada. Faça login novamente.'
  if (status === 403) return 'Sem permissão: esta ação é exclusiva do administrador.'
  if (status === 404) return 'Registro não encontrado.'
  if (status >= 500) return 'O servidor não conseguiu concluir a operação. Verifique os dados (ex.: código duplicado) e tente novamente.'
  return `Erro inesperado (HTTP ${status}).`
}

function normalizeFields(errors) {
  if (!errors || typeof errors !== 'object') return null
  const out = {}
  for (const [k, v] of Object.entries(errors)) {
    const key = k.replace(/^\$\./, '')
    out[key.charAt(0).toLowerCase() + key.slice(1)] = Array.isArray(v) ? v.join(' ') : String(v)
  }
  return out
}

export async function api(path, { method = 'GET', body, auth = false, timeout = 12000 } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const session = getSession()
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  let res
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch {
    clearTimeout(timer)
    const err = new ApiError(MSG_REDE, { kind: 'network' })
    emit('network', err)
    throw err
  }
  clearTimeout(timer)

  const text = await res.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  // O proxy do Vite responde 500/502/504 sem corpo quando a API está fora do ar
  if (res.status === 502 || res.status === 503 || res.status === 504 || (res.status === 500 && !text)) {
    const err = new ApiError(MSG_REDE, { kind: 'network', status: res.status })
    emit('network', err)
    throw err
  }

  emit('network', null)

  if (!res.ok) {
    const err = new ApiError(extractMessage(res.status, data), {
      status: res.status,
      fields: normalizeFields(data?.errors),
    })
    if (res.status === 401 && auth) emit('unauthorized', err)
    throw err
  }
  return data
}

export const Api = {
  login: (email, senha) => api('/api/auth/login', { method: 'POST', body: { email, senha } }),
  status: () => api('/api/status'),
  regioes: () => api('/api/regioes'),
  regiao: (id) => api(`/api/regioes/${id}`),
  criarRegiao: (dto) => api('/api/regioes', { method: 'POST', body: dto, auth: true }),
  atualizarRegiao: (id, dto) => api(`/api/regioes/${id}`, { method: 'PUT', body: dto, auth: true }),
  sensores: () => api('/api/sensores'),
  criarSensor: (dto) => api('/api/sensores', { method: 'POST', body: dto, auth: true }),
  medicoes: () => api('/api/medicoes'),
  alertas: () => api('/api/alertas'),
  alerta: (id) => api(`/api/alertas/${id}`),
  excluirAlerta: (id) => api(`/api/alertas/${id}`, { method: 'DELETE', auth: true }),
}
