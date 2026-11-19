// Tema claro/escuro. A preferência ('auto' | 'claro' | 'escuro') fica no
// localStorage; em 'auto' o app segue o tema do sistema operacional.
const KEY = 'alertaja.tema'
const media = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

export function getPreferencia() {
  try { return localStorage.getItem(KEY) || 'auto' } catch { return 'auto' }
}

function efetivo(pref) {
  if (pref === 'claro' || pref === 'escuro') return pref
  return media?.matches ? 'escuro' : 'claro'
}

export function aplicarTema(pref = getPreferencia()) {
  const t = efetivo(pref)
  document.documentElement.dataset.theme = t === 'escuro' ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = t === 'escuro' ? '#0D1B24' : '#F8FAF9'
}

export function salvarPreferencia(pref) {
  try { localStorage.setItem(KEY, pref) } catch { /* sem armazenamento: vale só nesta sessão */ }
  aplicarTema(pref)
}

media?.addEventListener?.('change', () => { if (getPreferencia() === 'auto') aplicarTema('auto') })
