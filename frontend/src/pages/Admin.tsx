import React, { useState, useEffect } from 'react';
import { regiaoService, sensorService } from '../services/api';
import { Regiao, Sensor, TipoSensor, RegiaoRequest, SensorRequest } from '../types';
import {
  ShieldCheck,
  MapPin,
  Cpu,
  Plus,
  Trash2,
  RefreshCw,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export const Admin: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<'regioes' | 'sensores'>('regioes');
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Modais de Criação / Edição
  const [modalRegiaoAberto, setModalRegiaoAberto] = useState(false);
  const [regiaoEditandoId, setRegiaoEditandoId] = useState<number | null>(null);
  const [formRegiao, setFormRegiao] = useState<RegiaoRequest>({ nome: '', cidade: '', estado: 'SP' });

  const [modalSensorAberto, setModalSensorAberto] = useState(false);
  const [sensorEditandoId, setSensorEditandoId] = useState<number | null>(null);
  const [formSensor, setFormSensor] = useState<SensorRequest>({
    regiaoId: 0,
    codigoIdentificador: '',
    tipo: 'PLUVIOMETRO',
    unidadeMedida: 'mm/h',
    limiteAtencao: 20,
    limiteAlerta: 40,
    limitePerigo: 60
  });

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const [resRegioes, resSensores] = await Promise.all([
        regiaoService.listar({ size: 100 }),
        sensorService.listar({ size: 100 })
      ]);
      setRegioes(resRegioes.content || []);
      setSensores(resSensores.content || []);
    } catch (err) {
      setMensagemErro('Falha ao carregar registros administrativos.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const exibirSucesso = (msg: string) => {
    setMensagemSucesso(msg);
    setMensagemErro(null);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const exibirErro = (msg: string) => {
    setMensagemErro(msg);
    setMensagemSucesso(null);
  };

  // ============================================================================
  // OPERAÇÕES DE REGIÕES
  // ============================================================================
  const abrirCriarRegiao = () => {
    setRegiaoEditandoId(null);
    setFormRegiao({ nome: '', cidade: '', estado: 'SP' });
    setModalRegiaoAberto(true);
  };

  const abrirEditarRegiao = (r: Regiao) => {
    setRegiaoEditandoId(r.id);
    setFormRegiao({ nome: r.nome, cidade: r.cidade, estado: r.estado });
    setModalRegiaoAberto(true);
  };

  const salvarRegiao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (regiaoEditandoId) {
        await regiaoService.atualizar(regiaoEditandoId, formRegiao);
        exibirSucesso('Região atualizada com sucesso!');
      } else {
        await regiaoService.criar(formRegiao);
        exibirSucesso('Região cadastrada com sucesso!');
      }
      setModalRegiaoAberto(false);
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Falha ao salvar região.');
    }
  };

  const alternarStatusRegiao = async (r: Regiao) => {
    try {
      if (r.ativo) {
        if (!window.confirm(`Deseja desativar a região "${r.nome}"? Sensores e alertas vinculados também serão logicamente desativados.`)) return;
        await regiaoService.desativar(r.id);
        exibirSucesso(`Região "${r.nome}" desativada (soft delete).`);
      } else {
        await regiaoService.reativar(r.id);
        exibirSucesso(`Região "${r.nome}" reativada com sucesso!`);
      }
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Erro ao alterar status da região.');
    }
  };

  // ============================================================================
  // OPERAÇÕES DE SENSORES
  // ============================================================================
  const abrirCriarSensor = () => {
    const primeiraRegiaoAtiva = regioes.find(r => r.ativo);
    setSensorEditandoId(null);
    setFormSensor({
      regiaoId: primeiraRegiaoAtiva ? primeiraRegiaoAtiva.id : 0,
      codigoIdentificador: '',
      tipo: 'PLUVIOMETRO',
      unidadeMedida: 'mm/h',
      limiteAtencao: 20,
      limiteAlerta: 40,
      limitePerigo: 60
    });
    setModalSensorAberto(true);
  };

  const abrirEditarSensor = (s: Sensor) => {
    setSensorEditandoId(s.id);
    setFormSensor({
      regiaoId: s.regiaoId,
      codigoIdentificador: s.codigoIdentificador,
      tipo: s.tipo,
      unidadeMedida: s.unidadeMedida,
      limiteAtencao: s.limiteAtencao,
      limiteAlerta: s.limiteAlerta,
      limitePerigo: s.limitePerigo
    });
    setModalSensorAberto(true);
  };

  const salvarSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSensor.limiteAtencao >= formSensor.limiteAlerta || formSensor.limiteAlerta >= formSensor.limitePerigo) {
      exibirErro('Validação dos Limiares: É obrigatório que Atenção < Alerta < Perigo.');
      return;
    }

    try {
      if (sensorEditandoId) {
        await sensorService.atualizar(sensorEditandoId, formSensor);
        exibirSucesso('Sensor atualizado com sucesso!');
      } else {
        await sensorService.criar(formSensor);
        exibirSucesso('Sensor cadastrado com sucesso!');
      }
      setModalSensorAberto(false);
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Falha ao salvar sensor.');
    }
  };

  const alternarStatusSensor = async (s: Sensor) => {
    try {
      if (s.ativo) {
        if (!window.confirm(`Deseja desativar o sensor "${s.codigoIdentificador}"? Ele deixará de aceitar ingestão de medições.`)) return;
        await sensorService.desativar(s.id);
        exibirSucesso(`Sensor "${s.codigoIdentificador}" desativado (soft delete).`);
      } else {
        await sensorService.reativar(s.id);
        exibirSucesso(`Sensor "${s.codigoIdentificador}" reativado!`);
      }
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Erro ao alterar status do sensor.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck size={28} style={{ color: '#c084fc' }} />
            Painel de Administração
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Gerenciamento administrativo de regiões monitoradas, infraestrutura de sensores e soft delete
          </p>
        </div>

        <div>
          {abaAtiva === 'regioes' ? (
            <button onClick={abrirCriarRegiao} className="btn btn-primary">
              <Plus size={16} /> Cadastrar Nova Região
            </button>
          ) : (
            <button onClick={abrirCriarSensor} className="btn btn-primary">
              <Plus size={16} /> Cadastrar Novo Sensor
            </button>
          )}
        </div>
      </div>

      {mensagemSucesso && (
        <div className="alert-box alert-box-success">
          <CheckCircle2 size={18} />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="alert-box alert-box-error">
          <AlertCircle size={18} />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Abas Administrativas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setAbaAtiva('regioes')}
          className={`btn ${abaAtiva === 'regioes' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <MapPin size={16} /> Regiões Monitoradas ({regioes.length})
        </button>
        <button
          onClick={() => setAbaAtiva('sensores')}
          className={`btn ${abaAtiva === 'sensores' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Cpu size={16} /> Sensores e Telemetria ({sensores.length})
        </button>
      </div>

      {/* ==================================================================== */}
      {/* ABA 1: REGIÕES */}
      {/* ==================================================================== */}
      {abaAtiva === 'regioes' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome da Região</th>
                  <th>Município / UF</th>
                  <th>Risco Atual</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações Administrativas</th>
                </tr>
              </thead>
              <tbody>
                {regioes.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.nome}</td>
                    <td>{r.cidade} - {r.estado}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.nivelRiscoAtual}</span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: r.ativo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: r.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)'
                      }}>
                        {r.ativo ? 'ATIVA' : 'INATIVA (SOFT DELETE)'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => abrirEditarRegiao(r)}
                          className="btn btn-secondary btn-sm"
                          title="Editar dados da região"
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        {r.ativo ? (
                          <button
                            onClick={() => alternarStatusRegiao(r)}
                            className="btn btn-danger btn-sm"
                            title="Desativar região (exclusão lógica)"
                          >
                            <Trash2 size={13} /> Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => alternarStatusRegiao(r)}
                            className="btn btn-success btn-sm"
                            title="Reativar região"
                          >
                            <RefreshCw size={13} /> Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 2: SENSORES */}
      {/* ==================================================================== */}
      {abaAtiva === 'sensores' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Região</th>
                  <th>Limites (Atenção / Alerta / Perigo)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações Administrativas</th>
                </tr>
              </thead>
              <tbody>
                {sensores.map((s) => (
                  <tr key={s.id}>
                    <td><code>{s.codigoIdentificador}</code></td>
                    <td>{s.tipo}</td>
                    <td>{s.nomeRegiao}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {s.limiteAtencao} / {s.limiteAlerta} / <strong style={{ color: 'var(--risk-perigo)' }}>{s.limitePerigo} {s.unidadeMedida}</strong>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: s.ativo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: s.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)'
                      }}>
                        {s.ativo ? 'ATIVO' : 'DESATIVADO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => abrirEditarSensor(s)}
                          className="btn btn-secondary btn-sm"
                          title="Editar sensor"
                        >
                          <Edit2 size={13} /> Editar
                        </button>
                        {s.ativo ? (
                          <button
                            onClick={() => alternarStatusSensor(s)}
                            className="btn btn-danger btn-sm"
                            title="Desativar sensor (soft delete)"
                          >
                            <Trash2 size={13} /> Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => alternarStatusSensor(s)}
                            className="btn btn-success btn-sm"
                            title="Reativar sensor"
                          >
                            <RefreshCw size={13} /> Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REGIÃO */}
      {/* ==================================================================== */}
      {modalRegiaoAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {regiaoEditandoId ? 'Editar Região' : 'Cadastrar Nova Região'}
              </h3>
              <button
                onClick={() => setModalRegiaoAberto(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvarRegiao}>
              <div className="form-group">
                <label className="form-label">Nome da Bacia ou Setor</label>
                <input
                  type="text"
                  className="input"
                  value={formRegiao.nome}
                  onChange={(e) => setFormRegiao({ ...formRegiao, nome: e.target.value })}
                  placeholder="Ex: Bacia do Rio Anhangabaú"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input
                    type="text"
                    className="input"
                    value={formRegiao.cidade}
                    onChange={(e) => setFormRegiao({ ...formRegiao, cidade: e.target.value })}
                    placeholder="Ex: São Paulo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">UF</label>
                  <input
                    type="text"
                    className="input"
                    value={formRegiao.estado}
                    maxLength={2}
                    onChange={(e) => setFormRegiao({ ...formRegiao, estado: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalRegiaoAberto(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {regiaoEditandoId ? 'Salvar Alterações' : 'Cadastrar Região'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: SENSOR */}
      {/* ==================================================================== */}
      {modalSensorAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {sensorEditandoId ? 'Editar Sensor' : 'Cadastrar Novo Sensor IoT'}
              </h3>
              <button
                onClick={() => setModalSensorAberto(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvarSensor}>
              <div className="form-group">
                <label className="form-label">Região Vinculada (Deve estar Ativa)</label>
                <select
                  className="select"
                  value={formSensor.regiaoId}
                  onChange={(e) => setFormSensor({ ...formSensor, regiaoId: Number(e.target.value) })}
                  required
                >
                  <option value={0}>Selecione uma região...</option>
                  {regioes.filter(r => r.ativo).map((r) => (
                    <option key={r.id} value={r.id}>{r.nome} ({r.cidade}/{r.estado})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Código Identificador Único</label>
                  <input
                    type="text"
                    className="input"
                    value={formSensor.codigoIdentificador}
                    onChange={(e) => setFormSensor({ ...formSensor, codigoIdentificador: e.target.value.toUpperCase() })}
                    placeholder="Ex: PLUV-CENTRO-01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Sensor</label>
                  <select
                    className="select"
                    value={formSensor.tipo}
                    onChange={(e) => {
                      const tipo = e.target.value as TipoSensor;
                      setFormSensor({
                        ...formSensor,
                        tipo,
                        unidadeMedida: tipo === 'PLUVIOMETRO' ? 'mm/h' : 'm'
                      });
                    }}
                  >
                    <option value="PLUVIOMETRO">Pluviômetro (Chuva)</option>
                    <option value="NIVEL_AGUA">Nível da Água (Rio)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unidade de Medida</label>
                <input
                  type="text"
                  className="input"
                  value={formSensor.unidadeMedida}
                  onChange={(e) => setFormSensor({ ...formSensor, unidadeMedida: e.target.value })}
                  placeholder="Ex: mm/h ou m"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--risk-atencao)' }}>Lim. Atenção</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formSensor.limiteAtencao}
                    onChange={(e) => setFormSensor({ ...formSensor, limiteAtencao: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--risk-alerta)' }}>Lim. Alerta</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formSensor.limiteAlerta}
                    onChange={(e) => setFormSensor({ ...formSensor, limiteAlerta: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--risk-perigo)' }}>Lim. Perigo</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formSensor.limitePerigo}
                    onChange={(e) => setFormSensor({ ...formSensor, limitePerigo: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
                * Regra obrigatória do AlertaJá: Limite Atenção &lt; Limite Alerta &lt; Limite Perigo.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModalSensorAberto(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {sensorEditandoId ? 'Salvar Sensor' : 'Cadastrar Sensor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
