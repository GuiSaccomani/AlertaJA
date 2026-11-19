import { useState } from 'react'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { dataHora } from '../format.js'
import { Header } from '../components/ui.jsx'

export default function Perfil() {
  const { session, isAdmin, logout, toast } = useApp()
  const [status, setStatus] = useState(null)
  const [checking, setChecking] = useState(false)

  const testar = async () => {
    setChecking(true)
    try {
      const s = await Api.status()
      setStatus({ ok: true, text: `${s.sistema} ${s.status} · v${s.versao}` })
      toast('API online.')
    } catch (e) {
      setStatus({ ok: false, text: e.message })
    } finally { setChecking(false) }
  }

  const iniciais = session.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <>
      <Header title="Perfil" />
      <div className="content">
        <section className="card profile">
          <div className="avatar" aria-hidden="true">{iniciais}</div>
          <div>
            <strong>{session.nome}</strong>
            <span className="muted">{session.email}</span>
            <span className={`role role-${isAdmin ? 'admin' : 'cidadao'}`}>{isAdmin ? 'Administrador' : 'Cidadão'}</span>
          </div>
        </section>

        <dl className="card details">
          <div><dt>Perfil de acesso</dt><dd><code>{session.role}</code></dd></div>
          <div><dt>Sessão expira em</dt><dd>{dataHora(session.expiraEm)}</dd></div>
          <div className="full"><dt>Permissões</dt><dd>
            {isAdmin
              ? 'Consultar painel e alertas, cadastrar e editar regiões, cadastrar sensores e excluir alertas.'
              : 'Consultar painel, regiões, sensores, medições e alertas da sua cidade.'}
          </dd></div>
        </dl>

        <section className="card">
          <div className="row-between">
            <strong>Conexão com a API</strong>
            <button className="btn btn-sm btn-ghost" onClick={testar} disabled={checking}>{checking ? 'Testando…' : 'Testar'}</button>
          </div>
          {status && <p className={status.ok ? 'ok-text' : 'error-text'}>{status.ok ? '● ' : '○ '}{status.text}</p>}
        </section>

        <section className="card tips">
          <strong>Em caso de emergência</strong>
          <p>Defesa Civil <b>199</b> · Bombeiros <b>193</b> · SAMU <b>192</b></p>
        </section>

        <button className="btn btn-outline-danger btn-block" onClick={() => { logout(''); toast('Você saiu da conta.', 'info') }}>Sair da conta</button>
      </div>
    </>
  )
}
