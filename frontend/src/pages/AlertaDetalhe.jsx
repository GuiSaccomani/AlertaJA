import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { useLoad } from '../hooks.js'
import { dataHora, nivelInfo, nomeRegiao, ORIENTACAO, STATUS_ALERTA } from '../format.js'
import { ConfirmDialog, ErrorBox, Header, NivelBadge, Spinner, Tag } from '../components/ui.jsx'

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
      toast('Alerta excluído com sucesso.')
      nav('/alertas', { replace: true })
    } catch (err) {
      toast(err.status === 403 ? 'Sem permissão para excluir alertas.' : err.message, 'error')
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
            <section className={`hero-risk hero-${nivelInfo(a.nivel).cls}`}>
              <span className="hero-label">{a.ativo ? 'Alerta ativo' : 'Alerta encerrado'}</span>
              <strong>{a.titulo}</strong>
              <p>{a.ativo ? ORIENTACAO[a.nivel] : 'A condição voltou ao normal ou foi encerrada pela equipe.'}</p>
            </section>

            <dl className="card details">
              <div><dt>Nível</dt><dd><NivelBadge nivel={a.nivel} /></dd></div>
              <div><dt>Status</dt><dd><Tag tone={a.ativo ? 'danger' : 'ok'}>{STATUS_ALERTA[a.status] || a.status}</Tag></dd></div>
              <div><dt>Região</dt><dd>
                <Link className="link" to={`/regioes/${a.regiaoId}`}>{data.regiao ? nomeRegiao(data.regiao) : a.nomeRegiao}</Link>
              </dd></div>
              <div><dt>Sensor</dt><dd><code>{a.codigoIdentificador}</code></dd></div>
              <div><dt>Emissão</dt><dd>{dataHora(a.dataEmissao)}</dd></div>
              <div><dt>Última ocorrência</dt><dd>{dataHora(a.dataUltimaOcorrencia)}</dd></div>
              <div><dt>Resolução</dt><dd>{dataHora(a.dataResolucao)}</dd></div>
              {a.descricao && <div className="full"><dt>Descrição</dt><dd>{a.descricao}</dd></div>}
            </dl>

            {isAdmin && (
              <div className="admin-zone">
                <span className="admin-label">Área do administrador</span>
                <button className="btn btn-danger btn-block" onClick={() => setConfirm(true)}>Excluir alerta</button>
                <small className="muted">A exclusão é permanente e recalcula o nível de risco da região.</small>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        title="Excluir este alerta?"
        text={a ? `"${a.titulo}" será removido permanentemente. Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        danger
        busy={busy}
        onConfirm={excluir}
        onCancel={() => setConfirm(false)}
      />
    </>
  )
}
