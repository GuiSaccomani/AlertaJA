import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Api } from '../api.js'
import { useLoad } from '../hooks.js'
import { dataHora, hora, nivelInfo, nomeRegiao, relativo, STATUS_ALERTA } from '../format.js'
import { Empty, ErrorBox, Header, NivelBadge, Skeleton } from '../components/ui.jsx'

export default function Alertas() {
  const [aba, setAba] = useState('ativos')
  const { data, error, loading, reload, updatedAt } = useLoad(
    async () => {
      const [alertas, regioes] = await Promise.all([Api.alertas(), Api.regioes()])
      return { alertas, regioes }
    },
    [],
    { interval: 10000 }
  )

  const view = useMemo(() => {
    if (!data) return null
    const porId = Object.fromEntries(data.regioes.map((r) => [r.id, r]))
    const enrich = (a) => ({ ...a, regiao: porId[a.regiaoId] })
    const ativos = data.alertas.filter((a) => a.ativo).map(enrich)
      .sort((a, b) => nivelInfo(b.nivel).ordem - nivelInfo(a.nivel).ordem)
    const resolvidos = data.alertas.filter((a) => !a.ativo).map(enrich)
    return { ativos, resolvidos }
  }, [data])

  const lista = view ? (aba === 'ativos' ? view.ativos : view.resolvidos) : []

  return (
    <>
      <Header title="Alertas" subtitle={updatedAt ? `Atualizado às ${hora(updatedAt)}` : 'Carregando…'}
        right={<button className="icon-btn" aria-label="Atualizar" onClick={() => reload()}>⟳</button>} />
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={aba === 'ativos'} className={aba === 'ativos' ? 'on' : ''} onClick={() => setAba('ativos')}>
          Ativos {view && <span className="count">{view.ativos.length}</span>}
        </button>
        <button role="tab" aria-selected={aba === 'resolvidos'} className={aba === 'resolvidos' ? 'on' : ''} onClick={() => setAba('resolvidos')}>
          Resolvidos {view && <span className="count">{view.resolvidos.length}</span>}
        </button>
      </div>
      <div className="content">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Skeleton lines={5} />}
        {view && lista.length === 0 && (
          aba === 'ativos'
            ? <Empty icon="✅" title="Nenhum alerta ativo" text="Quando um sensor ultrapassar o limite de atenção, o alerta aparecerá aqui." />
            : <Empty icon="🗂️" title="Nenhum alerta resolvido" />
        )}
        <div className="list">
          {lista.map((a) => (
            <Link key={a.id} to={`/alertas/${a.id}`} className={`card alert-card edge-${nivelInfo(a.nivel).cls} ${a.ativo ? '' : 'is-resolved'}`}>
              <div className="row-between">
                <strong>{a.titulo}</strong>
                <NivelBadge nivel={a.nivel} />
              </div>
              <span className="muted">{a.regiao ? nomeRegiao(a.regiao) : a.nomeRegiao} · {a.codigoIdentificador}</span>
              <span className="muted small">
                {a.ativo
                  ? `Emitido ${dataHora(a.dataEmissao)} · última ${relativo(a.dataUltimaOcorrencia || a.dataEmissao)}`
                  : `${STATUS_ALERTA[a.status] || a.status} · ${dataHora(a.dataResolucao)}`}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
