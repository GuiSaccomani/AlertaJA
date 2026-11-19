import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Api } from '../api.js'
import { useLoad } from '../hooks.js'
import { dataHora, hora, nivelInfo, relativo, STATUS_ALERTA } from '../format.js'
import { Empty, ErrorBox, Header, NivelBadge, RefreshButton, Skeleton } from '../components/ui.jsx'

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
      <Header title="Alertas" subtitle={updatedAt ? `Atualizado às ${hora(updatedAt)}` : 'Buscando dados'}
        right={<RefreshButton onClick={() => reload()} />} />
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
            ? <Empty title="Nenhum alerta ativo" text="Quando um sensor passar do limite de atenção, o alerta aparece aqui." />
            : <Empty title="Nenhum alerta resolvido ainda" />
        )}
        <ul className="rows">
          {lista.map((a) => (
            <li key={a.id}>
              <Link to={`/alertas/${a.id}`} className={`row alert-card risco-${nivelInfo(a.nivel).cls} ${a.ativo ? '' : 'is-resolved'}`}>
                <div className="row-main">
                  <strong>{a.titulo}</strong>
                  <span>{a.regiao ? `${a.regiao.nome}, ${a.regiao.cidade}/${a.regiao.estado}` : a.nomeRegiao}</span>
                  <small>
                    {a.ativo
                      ? `Emitido em ${dataHora(a.dataEmissao)}, última leitura ${relativo(a.dataUltimaOcorrencia || a.dataEmissao)}`
                      : `${STATUS_ALERTA[a.status] || a.status} em ${dataHora(a.dataResolucao)}`}
                  </small>
                </div>
                <NivelBadge nivel={a.nivel} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
