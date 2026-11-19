import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { useLoad } from '../hooks.js'
import { hora, nivelInfo, ORIENTACAO } from '../format.js'
import { Empty, ErrorBox, Header, NivelBadge, RefreshButton, Regua, Skeleton, Tag } from '../components/ui.jsx'


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
    const ativasR = data.regioes.filter((r) => r.ativo)
    const ativos = data.alertas.filter((a) => a.ativo)
      .map((a) => ({ ...a, regiao: porId[a.regiaoId] }))
      .sort((a, b) => nivelInfo(b.nivel).ordem - nivelInfo(a.nivel).ordem)
    const regioes = [...data.regioes]
      .filter((r) => mostrarInativas || r.ativo)
      .sort((a, b) => (b.ativo - a.ativo) || nivelInfo(b.nivelRiscoAtual).ordem - nivelInfo(a.nivelRiscoAtual).ordem)
    const contagem = { NORMAL: 0, ATENCAO: 0, ALERTA: 0, PERIGO: 0 }
    ativasR.forEach((r) => { contagem[r.nivelRiscoAtual] = (contagem[r.nivelRiscoAtual] || 0) + 1 })
    const critica = [...ativasR].sort((a, b) => nivelInfo(b.nivelRiscoAtual).ordem - nivelInfo(a.nivelRiscoAtual).ordem)[0]
    const inativas = data.regioes.length - ativasR.length
    return { ativos, regioes, contagem, critica, total: ativasR.length, inativas }
  }, [data, mostrarInativas])

  const pior = view?.critica?.nivelRiscoAtual || 'NORMAL'

  return (
    <>
      <Header
        title={`Olá, ${session.nome.split(' ')[0]}`}
        subtitle={updatedAt ? `Atualizado às ${hora(updatedAt)}` : 'Buscando dados'}
        right={<RefreshButton onClick={() => reload()} />}
      />
      <div className="content">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Skeleton lines={4} />}
        {view && (
          <>
            <section className={`hero hero-${nivelInfo(pior).cls}`}>
              <Regua nivel={pior} height={176} />
              <div className="hero-texto">
                <p className="hero-nivel">{nivelInfo(pior).label}</p>
                {view.critica && pior !== 'NORMAL'
                  ? <Link to={`/regioes/${view.critica.id}`} className="hero-lugar">{view.critica.nome}, {view.critica.cidade}</Link>
                  : <p className="hero-lugar">em todas as regiões</p>}
                <p className="hero-orientacao">{ORIENTACAO[pior]}</p>
                {pior === 'PERIGO' && <a className="btn-ligar" href="tel:199">Ligar 199</a>}
              </div>
            </section>

            <Link to="/alertas" className="faixa-alertas">
              {view.ativos.length === 0 ? 'Nenhum alerta ativo' : `Ver ${view.ativos.length === 1 ? 'o alerta ativo' : `os ${view.ativos.length} alertas ativos`}`}
            </Link>

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
              <Empty title="Nenhuma região cadastrada" text="O administrador cadastra regiões na aba Cadastro." />
            ) : (
              <ul className="rows">
                {view.regioes.map((r) => (
                  <li key={r.id}>
                    <Link to={`/regioes/${r.id}`} className={`row region-card ${r.ativo ? '' : 'is-inactive'}`}>
                      <div className="row-main">
                        <strong>{r.nome}</strong>
                        <span>{r.cidade}/{r.estado}</span>
                      </div>
                      {r.ativo ? <NivelBadge nivel={r.nivelRiscoAtual} /> : <Tag>Inativa</Tag>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  )
}
