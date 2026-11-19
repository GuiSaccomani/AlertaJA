import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { useLoad } from '../hooks.js'
import { classificar, dataHora, hora, nivelInfo, numero, ORIENTACAO, relativo, TIPOS_SENSOR } from '../format.js'
import { Empty, ErrorBox, Header, NivelBadge, Sparkline, Spinner, Tag } from '../components/ui.jsx'

export default function RegiaoDetalhe() {
  const { id } = useParams()
  const { isAdmin } = useApp()
  const { data, error, loading, reload, updatedAt } = useLoad(
    async () => {
      const [regiao, sensores, medicoes, alertas] = await Promise.all([
        Api.regiao(id), Api.sensores(), Api.medicoes(), Api.alertas(),
      ])
      return { regiao, sensores, medicoes, alertas }
    },
    [id],
    { interval: 10000 }
  )

  const view = useMemo(() => {
    if (!data) return null
    const sensores = data.sensores.filter((s) => s.regiaoId === id)
    const ids = new Set(sensores.map((s) => s.id))
    const porSensor = {}
    data.medicoes.filter((m) => ids.has(m.sensorId)).forEach((m) => {
      ;(porSensor[m.sensorId] ||= []).push(m)
    })
    // medições vêm ordenadas da mais recente para a mais antiga
    const ativos = data.alertas.filter((a) => a.regiaoId === id && a.ativo)
    return { sensores, porSensor, ativos }
  }, [data, id])

  const r = data?.regiao
  return (
    <>
      <Header title={r ? r.nome : 'Região'} subtitle={r ? `${r.cidade}/${r.estado}` : ''} back
        right={<button className="icon-btn" aria-label="Atualizar" onClick={() => reload()}>⟳</button>} />
      <div className="content">
        {loading && !data && <Spinner />}
        <ErrorBox error={error} onRetry={reload} />
        {r && view && (
          <>
            <section className={`hero-risk hero-${nivelInfo(r.nivelRiscoAtual).cls}`}>
              <span className="hero-label">Nível de risco atual {r.ativo ? '' : '· região inativa'}</span>
              <strong>{nivelInfo(r.nivelRiscoAtual).label}</strong>
              <p>{ORIENTACAO[r.nivelRiscoAtual]}</p>
              <span className="hero-meta">Atualizado {relativo(r.atualizadoEm)} · tela às {hora(updatedAt)}</span>
            </section>

            {view.ativos.length > 0 && (
              <div className="list">
                {view.ativos.map((a) => (
                  <Link key={a.id} to={`/alertas/${a.id}`} className={`card alert-card edge-${nivelInfo(a.nivel).cls}`}>
                    <div className="row-between"><strong>{a.titulo}</strong><NivelBadge nivel={a.nivel} /></div>
                    <span className="muted small">Sensor {a.codigoIdentificador} · {relativo(a.dataUltimaOcorrencia || a.dataEmissao)}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="section-head">
              <h2>Sensores <span className="count">{view.sensores.length}</span></h2>
              {isAdmin && <Link className="link" to="/cadastro">+ Novo sensor</Link>}
            </div>
            {view.sensores.length === 0 && <Empty icon="📡" title="Nenhum sensor nesta região" />}
            <div className="list">
              {view.sensores.map((s) => {
                const meds = view.porSensor[s.id] || []
                const ultima = meds[0]
                const serie = meds.slice(0, 12).reverse().map((m) => Number(m.valor))
                const nivelAtual = ultima ? classificar(Number(ultima.valor), s) : null
                return (
                  <div key={s.id} className={`card sensor-card ${s.ativo ? '' : 'is-inactive'}`}>
                    <div className="row-between">
                      <div>
                        <strong>{TIPOS_SENSOR[s.tipo] || s.tipo}</strong>
                        <span className="muted"> · <code>{s.codigoIdentificador}</code></span>
                      </div>
                      {s.ativo ? (nivelAtual && <NivelBadge nivel={nivelAtual} />) : <Tag>inativo</Tag>}
                    </div>
                    <div className="reading">
                      <b>{ultima ? numero(ultima.valor) : '—'}</b>
                      <span>{s.unidadeMedida}</span>
                      <small className="muted">{ultima ? `em ${dataHora(ultima.dataHora)}` : 'sem medições'}</small>
                    </div>
                    {serie.length > 0 && <Sparkline values={serie} sensor={s} />}
                    <div className="limits">
                      <span className="lim lim-atencao">Atenção ≥ {numero(s.limiteAtencao)}</span>
                      <span className="lim lim-alerta">Alerta ≥ {numero(s.limiteAlerta)}</span>
                      <span className="lim lim-perigo">Perigo ≥ {numero(s.limitePerigo)}</span>
                    </div>
                    {meds.length > 0 && (
                      <details className="history">
                        <summary>Últimas medições ({Math.min(meds.length, 8)})</summary>
                        <ul>
                          {meds.slice(0, 8).map((m) => (
                            <li key={m.id}>
                              <span>{dataHora(m.dataHora)}</span>
                              <b>{numero(m.valor)} {m.unidadeMedida}</b>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
