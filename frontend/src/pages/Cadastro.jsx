import { useEffect, useState } from 'react'
import { Api } from '../api.js'
import { useApp } from '../context.jsx'
import { useLoad } from '../hooks.js'
import { nomeRegiao } from '../format.js'
import { ErrorBox, Header, Spinner } from '../components/ui.jsx'

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')

function Field({ label, error, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && !error && <small className="muted">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

function Submit({ busy, children }) {
  return (
    <button className="btn btn-primary btn-block" disabled={busy}>
      {busy ? <><span className="spinner spinner-sm" /> Salvando…</> : children}
    </button>
  )
}

function validarRegiao(f) {
  const e = {}
  if (!f.nome.trim()) e.nome = 'Informe o nome da região.'
  else if (f.nome.trim().length > 100) e.nome = 'Máximo de 100 caracteres.'
  if (!f.cidade.trim()) e.cidade = 'Informe a cidade.'
  else if (f.cidade.trim().length > 100) e.cidade = 'Máximo de 100 caracteres.'
  if (!/^[A-Za-z]{2}$/.test(f.estado.trim())) e.estado = 'Use a sigla da UF com 2 letras.'
  return e
}

function FormRegiao({ onSaved }) {
  const { toast } = useApp()
  const vazio = { nome: '', cidade: '', estado: '' }
  const [f, setF] = useState(vazio)
  const [err, setErr] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const v = validarRegiao(f)
    setErr(v); setApiErr('')
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      const r = await Api.criarRegiao({ nome: f.nome.trim(), cidade: f.cidade.trim(), estado: f.estado.trim().toUpperCase() })
      toast(`Região "${r.nome}" cadastrada com sucesso.`)
      setF(vazio)
      onSaved?.()
    } catch (ex) {
      setApiErr(ex.message)
      if (ex.fields) setErr(ex.fields)
      toast('Não foi possível cadastrar a região.', 'error')
    } finally { setBusy(false) }
  }

  return (
    <form className="form bloco" onSubmit={submit} noValidate id="form-regiao">
      <h3>Nova região</h3>
      {apiErr && <div className="notice notice-error" role="alert">{apiErr}</div>}
      <Field label="Nome do bairro / região" error={err.nome}>
        <input value={f.nome} onChange={set('nome')} placeholder="Ex.: Vila Esperança" maxLength={120} aria-invalid={!!err.nome} />
      </Field>
      <div className="grid-2">
        <Field label="Cidade" error={err.cidade}>
          <input value={f.cidade} onChange={set('cidade')} placeholder="Ex.: Divinópolis" aria-invalid={!!err.cidade} />
        </Field>
        <Field label="UF" error={err.estado}>
          <input value={f.estado} onChange={set('estado')} placeholder="MG" maxLength={3} list="ufs" aria-invalid={!!err.estado} style={{ textTransform: 'uppercase' }} />
        </Field>
      </div>
      <datalist id="ufs">{UFS.map((u) => <option key={u} value={u} />)}</datalist>
      <Submit busy={busy}>Cadastrar região</Submit>
    </form>
  )
}

function FormSensor({ regioes }) {
  const { toast } = useApp()
  const ativas = regioes.filter((r) => r.ativo)
  const vazio = { regiaoId: '', tipo: 'PLUVIOMETRO', codigoIdentificador: '', unidadeMedida: 'mm', limiteAtencao: '', limiteAlerta: '', limitePerigo: '' }
  const [f, setF] = useState(vazio)
  const [err, setErr] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => {
    const v = e.target.value
    if (k === 'tipo') setF({ ...f, tipo: v, unidadeMedida: v === 'PLUVIOMETRO' ? 'mm' : 'cm' })
    else setF({ ...f, [k]: v })
  }

  const validar = () => {
    const e = {}
    if (!f.regiaoId) e.regiaoId = 'Selecione a região.'
    if (!f.codigoIdentificador.trim()) e.codigoIdentificador = 'Informe o código (ex.: PLUV-010).'
    else if (f.codigoIdentificador.trim().length > 50) e.codigoIdentificador = 'Máximo de 50 caracteres.'
    if (!f.unidadeMedida.trim()) e.unidadeMedida = 'Informe a unidade.'
    const at = Number(f.limiteAtencao), al = Number(f.limiteAlerta), pe = Number(f.limitePerigo)
    ;[['limiteAtencao', at], ['limiteAlerta', al], ['limitePerigo', pe]].forEach(([k, n]) => {
      if (f[k] === '' || isNaN(n)) e[k] = 'Obrigatório.'
      else if (n < 1) e[k] = 'Mínimo 1.'
    })
    if (!e.limiteAtencao && !e.limiteAlerta && at >= al) e.limiteAlerta = 'Deve ser maior que Atenção.'
    if (!e.limiteAlerta && !e.limitePerigo && al >= pe) e.limitePerigo = 'Deve ser maior que Alerta.'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const v = validar()
    setErr(v); setApiErr('')
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      const s = await Api.criarSensor({
        regiaoId: f.regiaoId,
        codigoIdentificador: f.codigoIdentificador.trim().toUpperCase(),
        tipo: f.tipo,
        unidadeMedida: f.unidadeMedida.trim(),
        limiteAtencao: Number(f.limiteAtencao),
        limiteAlerta: Number(f.limiteAlerta),
        limitePerigo: Number(f.limitePerigo),
      })
      toast(`Sensor ${s.codigoIdentificador} cadastrado.`)
      setF(vazio)
    } catch (ex) {
      setApiErr(ex.message)
      if (ex.fields) setErr(ex.fields)
      toast('Não foi possível cadastrar o sensor.', 'error')
    } finally { setBusy(false) }
  }

  return (
    <form className="form bloco" onSubmit={submit} noValidate id="form-sensor">
      <h3>Novo sensor</h3>
      {apiErr && <div className="notice notice-error" role="alert">{apiErr}</div>}
      <Field label="Região" error={err.regiaoId}>
        <select value={f.regiaoId} onChange={set('regiaoId')} aria-invalid={!!err.regiaoId}>
          <option value="">Selecione…</option>
          {ativas.map((r) => <option key={r.id} value={r.id}>{nomeRegiao(r)}</option>)}
        </select>
      </Field>
      <div className="grid-2">
        <Field label="Tipo" error={err.tipo}>
          <select value={f.tipo} onChange={set('tipo')}>
            <option value="PLUVIOMETRO">Pluviômetro</option>
            <option value="NIVEL_AGUA">Nível da água</option>
          </select>
        </Field>
        <Field label="Unidade" error={err.unidadeMedida}>
          <select value={f.unidadeMedida} onChange={set('unidadeMedida')}>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
          </select>
        </Field>
      </div>
      <Field label="Código identificador" error={err.codigoIdentificador} hint="Único por sensor, ex.: PLUV-010">
        <input value={f.codigoIdentificador} onChange={set('codigoIdentificador')} placeholder="PLUV-010" aria-invalid={!!err.codigoIdentificador} />
      </Field>
      <div className="grid-3">
        <Field label="Atenção" error={err.limiteAtencao}>
          <input inputMode="decimal" type="number" value={f.limiteAtencao} onChange={set('limiteAtencao')} aria-invalid={!!err.limiteAtencao} />
        </Field>
        <Field label="Alerta" error={err.limiteAlerta}>
          <input inputMode="decimal" type="number" value={f.limiteAlerta} onChange={set('limiteAlerta')} aria-invalid={!!err.limiteAlerta} />
        </Field>
        <Field label="Perigo" error={err.limitePerigo}>
          <input inputMode="decimal" type="number" value={f.limitePerigo} onChange={set('limitePerigo')} aria-invalid={!!err.limitePerigo} />
        </Field>
      </div>
      <small className="muted">Os limites precisam crescer: atenção, depois alerta, depois perigo. Leituras acima de cada um abrem o alerta correspondente.</small>
      <Submit busy={busy}>Cadastrar sensor</Submit>
    </form>
  )
}

function FormEditarRegiao({ regioes, onSaved }) {
  const { toast } = useApp()
  const [id, setId] = useState('')
  const [f, setF] = useState(null)
  const [err, setErr] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const r = regioes.find((x) => x.id === id)
    setF(r ? { nome: r.nome, cidade: r.cidade, estado: r.estado, ativo: r.ativo } : null)
    setErr({}); setApiErr('')
  }, [id, regioes])

  const set = (k) => (e) => setF({ ...f, [k]: k === 'ativo' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const v = validarRegiao(f)
    setErr(v); setApiErr('')
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      await Api.atualizarRegiao(id, { nome: f.nome.trim(), cidade: f.cidade.trim(), estado: f.estado.trim().toUpperCase(), ativo: f.ativo })
      // A resposta do PUT pode não trazer todos os campos: recarrega do servidor
      const atual = await Api.regiao(id)
      toast(`Região atualizada (${atual.ativo ? 'ativa' : 'inativa'}).`)
      onSaved?.()
    } catch (ex) {
      setApiErr(ex.message)
      if (ex.fields) setErr(ex.fields)
      toast('Não foi possível atualizar a região.', 'error')
    } finally { setBusy(false) }
  }

  return (
    <form className="form bloco" onSubmit={submit} noValidate id="form-editar">
      <h3>Editar região</h3>
      <Field label="Selecione a região">
        <select value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Selecione…</option>
          {regioes.map((r) => <option key={r.id} value={r.id}>{nomeRegiao(r)}{r.ativo ? '' : ' (inativa)'}</option>)}
        </select>
      </Field>
      {f && (
        <>
          {apiErr && <div className="notice notice-error" role="alert">{apiErr}</div>}
          <Field label="Nome" error={err.nome}><input value={f.nome} onChange={set('nome')} aria-invalid={!!err.nome} /></Field>
          <div className="grid-2">
            <Field label="Cidade" error={err.cidade}><input value={f.cidade} onChange={set('cidade')} aria-invalid={!!err.cidade} /></Field>
            <Field label="UF" error={err.estado}><input value={f.estado} onChange={set('estado')} maxLength={3} aria-invalid={!!err.estado} /></Field>
          </div>
          <label className="switch switch-lg">
            <input type="checkbox" checked={f.ativo} onChange={set('ativo')} />
            <span>Região ativa (recebe sensores e aparece no painel)</span>
          </label>
          <Submit busy={busy}>Salvar alterações</Submit>
        </>
      )}
    </form>
  )
}

export default function Cadastro() {
  const [aba, setAba] = useState('regiao')
  const { data, error, loading, reload } = useLoad(() => Api.regioes(), [])
  return (
    <>
      <Header title="Cadastro" subtitle="Somente administradores" />
      <div className="segmented" role="tablist">
        {[['regiao', 'Nova região'], ['sensor', 'Novo sensor'], ['editar', 'Editar região']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={aba === k} className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{l}</button>
        ))}
      </div>
      <div className="content">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Spinner />}
        {aba === 'regiao' && <FormRegiao onSaved={() => reload(true)} />}
        {aba === 'sensor' && data && <FormSensor regioes={data} />}
        {aba === 'editar' && data && <FormEditarRegiao regioes={data} onSaved={() => reload(true)} />}
      </div>
    </>
  )
}
