import { useCallback, useEffect, useRef, useState } from 'react'

// Carrega dados de uma ou mais chamadas da API, com recarga opcional por intervalo.
export function useLoad(loader, deps = [], { interval = 0 } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const d = await loaderRef.current()
      setData(d)
      setError(null)
      setUpdatedAt(new Date())
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    if (!interval) return undefined
    const t = setInterval(() => reload(true), interval)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, reload, updatedAt }
}
