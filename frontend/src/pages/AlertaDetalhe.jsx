import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { useLoad } from '../hooks.js'
import { dataHora, nivelInfo, nomeRegiao, ORIENTACAO, STATUS_ALERTA } from '../format.js'
import { ConfirmDialog, ErrorBox, Header, NivelBadge, Regua, Spinner, Tag } from '../components/ui.jsx'

export default function AlertaDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const { isAdmin, toast } = useApp()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const { data, error, loading, reload } = useLoad(async () => {
    const a = await Api.alerta(id)
    let regiao = null
    try { regiao = await Api.regiao(a.regiaoId) } catch { /* opcional */ }
    return { a, regiao }
  }, [id])

  const excluir = async () => {
    setBusy(true)
    try {
      await Api.excluirAlerta(id)
      toast('Alerta excluído.')
      nav('/alertas', { replace: true })
    } catch (err) {
      toast(err.status === 403 ? 'Seu perfil não pode excluir alertas.' : err.message, 'error')
      setConfirm(false)
    } finally {
      setBusy(false)
    }
  }

  const a = data?.a
  return (
    <>
      <Header title="Detalhe do alerta" back />
      <div className="content">
        {loading && <Spinner />}
        <ErrorBox error={error} onRetry={reload} />
        {a && (
          <>
            <section className={`hero hero-${nivelInfo(a.nivel).cls} ${a.ativo ? '' : 'hero-encerrado'}`}>
              <Regua nivel={a.nivel} height={150} />
              <div className="hero-texto">
                <p className="hero-nivel">{nivelInfo(a.nivel).label}</p>
                <p className="hero-lugar">{a.titulo}</p>
                <p className="hero-orientacao">{a.ativo ? ORIENTACAO[a.nivel] : 'Alerta encerrado. A leitura do sensor voltou ao normal ou a equipe encerrou o alerta.'}</p>
              </div>
            </section>

            <dl className="details">
              <div><dt>Situação</dt><dd><Tag tone={a.ativo ? 'danger' : 'ok'}>{STATUS_ALERTA[a.status] || a.status}</Tag></dd></div>
              <div><dt>Nível</dt><dd><NivelBadge nivel={a.nivel} /></dd></div>
              <div><dt>Região</dt><dd>
                <Link className="link" to={`/regioes/${a.regiaoId}`}>{data.regiao ? nomeRegiao(data.regiao) : a.nomeRegiao}</Link>
              </dd></div>
              <div><dt>Sensor</dt><dd>{a.codigoIdentificador}</dd></div>
              <div><dt>Emitido em</dt><dd>{dataHora(a.dataEmissao)}</dd></div>
              <div><dt>Última leitura</dt><dd>{dataHora(a.dataUltimaOcorrencia)}</dd></div>
              <div><dt>Encerrado em</dt><dd>{dataHora(a.dataResolucao)}</dd></div>
              {a.descricao && <div className="full"><dt>Descrição</dt><dd>{a.descricao}</dd></div>}
            </dl>

            {isAdmin && (
              <div className="admin-zone">
                <p>A exclusão é permanente e recalcula o nível de risco da região.</p>
                <button className="btn btn-danger btn-block" onClick={() => setConfirm(true)}>Excluir alerta</button>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        title="Excluir este alerta?"
        text={a ? `"${a.titulo}" será removido do histórico. Não dá para desfazer.` : ''}
        confirmLabel="Excluir alerta"
        danger
        busy={busy}
        onConfirm={excluir}
        onCancel={() => setConfirm(false)}
      />
    </>
  )
}
