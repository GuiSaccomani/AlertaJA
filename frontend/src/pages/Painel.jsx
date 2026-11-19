import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { useLoad } from '../hooks.js'
import { hora, nivelInfo, nomeRegiao, ORIENTACAO, relativo } from '../format.js'
import { Empty, ErrorBox, Header, NivelBadge, Skeleton, Tag } from '../components/ui.jsx'

export default function Painel() {
  const { session } = useApp()
  const [mostrarInativas, setMostrarInativas] = useState(false)
  const { data, error, loading, reload, updatedAt } = useLoad(
    async () => {
      const [regioes, alertas] = await Promise.all([Api.regioes(), Api.alertas()])
      return { regioes, alertas }
    },
    [],
    { interval: 10000 }
  )

  const view = useMemo(() => {
    if (!data) return null
    const porId = Object.fromEntries(data.regioes.map((r) => [r.id, r]))
    const ativos = data.alertas.filter((a) => a.ativo)
      .map((a) => ({ ...a, regiao: porId[a.regiaoId] }))
      .sort((a, b) => nivelInfo(b.nivel).ordem - nivelInfo(a.nivel).ordem)
    const regioes = [...data.regioes]
      .filter((r) => mostrarInativas || r.ativo)
      .sort((a, b) => (b.ativo - a.ativo) || nivelInfo(b.nivelRiscoAtual).ordem - nivelInfo(a.nivelRiscoAtual).ordem)
    const contagem = { NORMAL: 0, ATENCAO: 0, ALERTA: 0, PERIGO: 0 }
    data.regioes.filter((r) => r.ativo).forEach((r) => { contagem[r.nivelRiscoAtual] = (contagem[r.nivelRiscoAtual] || 0) + 1 })
    const pior = data.regioes.filter((r) => r.ativo).reduce((p, r) => (nivelInfo(r.nivelRiscoAtual).ordem > nivelInfo(p).ordem ? r.nivelRiscoAtual : p), 'NORMAL')
    const inativas = data.regioes.filter((r) => !r.ativo).length
    return { ativos, regioes, contagem, pior, inativas }
  }, [data, mostrarInativas])

  return (
    <>
      <Header
        title={`Olá, ${session.nome.split(' ')[0]}`}
        subtitle={updatedAt ? `Atualizado às ${hora(updatedAt)} · auto 10s` : 'Carregando…'}
        right={<button className="icon-btn" aria-label="Atualizar" onClick={() => reload()} title="Atualizar">⟳</button>}
      />
      <div className="content">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Skeleton lines={4} />}
        {view && (
          <>
            <section className={`hero-risk hero-${nivelInfo(view.pior).cls}`}>
              <span className="hero-label">Maior risco monitorado</span>
              <strong>{nivelInfo(view.pior).label}</strong>
              <p>{ORIENTACAO[view.pior]}</p>
            </section>

            <section className="stats">
              {['PERIGO', 'ALERTA', 'ATENCAO', 'NORMAL'].map((n) => (
                <div key={n} className={`stat stat-${nivelInfo(n).cls}`}>
                  <b>{view.contagem[n] || 0}</b>
                  <span>{nivelInfo(n).label}</span>
                </div>
              ))}
            </section>

            <div className="section-head">
              <h2>Alertas ativos <span className="count">{view.ativos.length}</span></h2>
              <Link to="/alertas" className="link">Ver todos</Link>
            </div>
            {view.ativos.length === 0 ? (
              <Empty icon="✅" title="Nenhum alerta ativo" text="Todas as regiões monitoradas estão em condição normal." />
            ) : (
              <div className="list">
                {view.ativos.slice(0, 4).map((a) => (
                  <Link key={a.id} to={`/alertas/${a.id}`} className={`card alert-card edge-${nivelInfo(a.nivel).cls}`}>
                    <div className="row-between">
                      <strong>{a.titulo}</strong>
                      <NivelBadge nivel={a.nivel} />
                    </div>
                    <span className="muted">{a.regiao ? nomeRegiao(a.regiao) : a.nomeRegiao} · sensor {a.codigoIdentificador}</span>
                    <span className="muted small">Última ocorrência {relativo(a.dataUltimaOcorrencia || a.dataEmissao)}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="section-head">
              <h2>Regiões monitoradas</h2>
              {view.inativas > 0 && (
                <label className="switch">
                  <input type="checkbox" checked={mostrarInativas} onChange={(e) => setMostrarInativas(e.target.checked)} />
                  <span>Mostrar inativas ({view.inativas})</span>
                </label>
              )}
            </div>
            {view.regioes.length === 0 ? (
              <Empty icon="🗺️" title="Nenhuma região cadastrada" />
            ) : (
              <div className="list">
                {view.regioes.map((r) => (
                  <Link key={r.id} to={`/regioes/${r.id}`} className={`card region-card ${r.ativo ? '' : 'is-inactive'}`}>
                    <div>
                      <strong>{r.nome}</strong>
                      <span className="muted">{r.cidade}/{r.estado}</span>
                    </div>
                    <div className="region-right">
                      {!r.ativo && <Tag>inativa</Tag>}
                      <NivelBadge nivel={r.nivelRiscoAtual} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <p className="hint">Toque em uma região para ver os sensores e as últimas medições recebidas dos dispositivos IoT.</p>
          </>
        )}
      </div>
    </>
  )
}
