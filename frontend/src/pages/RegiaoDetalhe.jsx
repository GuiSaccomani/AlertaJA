import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { useLoad } from '../hooks.js'
import { classificar, dataHora, nivelInfo, numero, ORIENTACAO, relativo, TIPOS_SENSOR } from '../format.js'
import { Empty, ErrorBox, Header, NivelBadge, RefreshButton, Regua, Sparkline, Spinner, Tag } from '../components/ui.jsx'

// Escala horizontal com os limites do sensor, como as marcas de uma régua
function Escala({ s, valor }) {
  const max = s.limitePerigo * 1.25
  const pos = (v) => `${Math.min(100, (v / max) * 100)}%`
  return (
    <div className="escala" aria-hidden="true">
      <div className="escala-trilho">
        <span className="trecho trecho-normal" style={{ width: pos(s.limiteAtencao) }} />
        <span className="trecho trecho-atencao" style={{ left: pos(s.limiteAtencao), width: `calc(${pos(s.limiteAlerta)} - ${pos(s.limiteAtencao)})` }} />
        <span className="trecho trecho-alerta" style={{ left: pos(s.limiteAlerta), width: `calc(${pos(s.limitePerigo)} - ${pos(s.limiteAlerta)})` }} />
        <span className="trecho trecho-perigo" style={{ left: pos(s.limitePerigo), right: 0 }} />
        {valor !== undefined && <span className="escala-ponteiro" style={{ left: pos(valor) }} />}
      </div>
      <div className="escala-marcas">
        <span style={{ left: 0 }}>0</span>
        <span style={{ left: pos(s.limiteAtencao) }}>{numero(s.limiteAtencao)}</span>
        <span style={{ left: pos(s.limiteAlerta) }}>{numero(s.limiteAlerta)}</span>
        <span style={{ left: pos(s.limitePerigo) }}>{numero(s.limitePerigo)}</span>
      </div>
    </div>
  )
}

export default function RegiaoDetalhe() {
  const { id } = useParams()
  const { isAdmin } = useApp()
  const { data, error, loading, reload } = useLoad(
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
    const ativos = data.alertas.filter((a) => a.regiaoId === id && a.ativo)
    return { sensores, porSensor, ativos }
  }, [data, id])

  const r = data?.regiao
  return (
    <>
      <Header title={r ? r.nome : 'Região'} subtitle={r ? `${r.cidade}/${r.estado}` : ''} back
        right={<RefreshButton onClick={() => reload()} />} />
      <div className="content">
        {loading && !data && <Spinner />}
        <ErrorBox error={error} onRetry={reload} />
        {r && view && (
          <>
            <section className={`hero hero-${nivelInfo(r.nivelRiscoAtual).cls}`}>
              <Regua nivel={r.nivelRiscoAtual} height={150} />
              <div className="hero-texto">
                <p className="hero-nivel">{nivelInfo(r.nivelRiscoAtual).label}</p>
                <p className="hero-lugar">{r.ativo ? `Atualizado ${relativo(r.atualizadoEm)}` : 'Região inativa'}</p>
                <p className="hero-orientacao">{ORIENTACAO[r.nivelRiscoAtual]}</p>
              </div>
            </section>

            {view.ativos.length > 0 && (
              <ul className="rows">
                {view.ativos.map((a) => (
                  <li key={a.id}>
                    <Link to={`/alertas/${a.id}`} className={`row alert-card risco-${nivelInfo(a.nivel).cls}`}>
                      <div className="row-main">
                        <strong>{a.titulo}</strong>
                        <small>Sensor {a.codigoIdentificador}, {relativo(a.dataUltimaOcorrencia || a.dataEmissao)}</small>
                      </div>
                      <NivelBadge nivel={a.nivel} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="section-head">
              <h2>Sensores <span className="count">{view.sensores.length}</span></h2>
              {isAdmin && <Link className="link" to="/cadastro">Cadastrar sensor</Link>}
            </div>
            {view.sensores.length === 0 && <Empty title="Nenhum sensor nesta região" text="Sem sensor, a região não recebe leituras nem alertas." />}
            {view.sensores.map((s) => {
              const meds = view.porSensor[s.id] || []
              const ultima = meds[0]
              const serie = meds.slice(0, 16).reverse().map((m) => Number(m.valor))
              const nivelAtual = ultima ? classificar(Number(ultima.valor), s) : null
              return (
                <article key={s.id} className={`sensor-card ${s.ativo ? '' : 'is-inactive'}`}>
                  <div className="sensor-topo">
                    <div>
                      <h3>{TIPOS_SENSOR[s.tipo] || s.tipo}</h3>
                      <span className="sensor-codigo">{s.codigoIdentificador}</span>
                    </div>
                    {s.ativo ? (nivelAtual && <NivelBadge nivel={nivelAtual} />) : <Tag>Inativo</Tag>}
                  </div>
                  <p className="leitura">
                    <b>{ultima ? numero(ultima.valor) : '—'}</b>
                    <span>{s.unidadeMedida}</span>
                  </p>
                  <p className="leitura-quando">{ultima ? `Última leitura em ${dataHora(ultima.dataHora)}` : 'Ainda sem leituras'}</p>
                  <Escala s={s} valor={ultima ? Number(ultima.valor) : undefined} />
                  {meds.length > 0 && (
                    <details className="history">
                      <summary>Últimas {Math.min(meds.length, 8)} leituras</summary>
                      {serie.length > 1 && <Sparkline values={serie} sensor={s} />}
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
                </article>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
