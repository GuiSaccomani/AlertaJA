import { useState } from 'react'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { dataHora } from '../format.js'
import { getPreferencia, salvarPreferencia } from '../theme.js'
import { Header } from '../components/ui.jsx'

export default function Perfil() {
  const { session, isAdmin, logout, toast } = useApp()
  const [status, setStatus] = useState(null)
  const [checking, setChecking] = useState(false)
  const [tema, setTema] = useState(getPreferencia())

  const testar = async () => {
    setChecking(true)
    try {
      const s = await Api.status()
      setStatus({ ok: true, text: `API ${s.status.toLowerCase()}, versão ${s.versao}` })
      toast('API online.')
    } catch (e) {
      setStatus({ ok: false, text: e.message })
    } finally { setChecking(false) }
  }

  return (
    <>
      <Header title="Perfil" />
      <div className="content">
        <section className="perfil-topo">
          <p className="perfil-nome">{session.nome}</p>
          <p>{session.email}</p>
          <span className={`role role-${isAdmin ? 'admin' : 'cidadao'}`}>{isAdmin ? 'Administrador' : 'Cidadão'}</span>
        </section>

        <dl className="details">
          <div className="full"><dt>O que você pode fazer</dt><dd>
            {isAdmin
              ? 'Acompanhar o painel e os alertas, cadastrar e editar regiões, cadastrar sensores e excluir alertas.'
              : 'Acompanhar o painel, as regiões, os sensores e os alertas.'}
          </dd></div>
          <div><dt>Sessão válida até</dt><dd>{dataHora(session.expiraEm)}</dd></div>
          <div><dt>Perfil técnico</dt><dd>{session.role}</dd></div>
        </dl>

        <section className="bloco">
          <h2 id="tema-titulo">Aparência</h2>
          <div className="tema-opcoes" role="radiogroup" aria-labelledby="tema-titulo">
            {[['auto', 'Igual ao sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, l]) => (
              <button key={v} role="radio" aria-checked={tema === v} className={tema === v ? 'on' : ''}
                onClick={() => { setTema(v); salvarPreferencia(v) }}>{l}</button>
            ))}
          </div>
        </section>

        <section className="bloco">
          <div className="row-between">
            <h2>Conexão com a API</h2>
            <button className="btn btn-sm btn-ghost" onClick={testar} disabled={checking}>{checking ? 'Testando' : 'Testar conexão'}</button>
          </div>
          {status && <p className={status.ok ? 'ok-text' : 'error-text'}>{status.text}</p>}
        </section>

        <section className="bloco emergencia">
          <h2>Em emergência</h2>
          <ul>
            <li><a href="tel:199"><b>199</b> Defesa Civil</a></li>
            <li><a href="tel:193"><b>193</b> Bombeiros</a></li>
            <li><a href="tel:192"><b>192</b> SAMU</a></li>
          </ul>
        </section>

        <button className="btn btn-outline-danger btn-block" onClick={() => { logout(''); toast('Você saiu da conta.', 'info') }}>Sair da conta</button>
      </div>
    </>
  )
}
