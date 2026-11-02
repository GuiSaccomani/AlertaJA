import React, { useState, useEffect, useRef } from 'react';
import { regiaoService, sensorService } from '../services/api';
import { Regiao, Sensor, TipoSensor, RegiaoRequest, SensorRequest } from '../types';
import { animatePageEnter } from '../utils/motion';
import {
  Shield,
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (containerRef.current) {
      animatePageEnter(containerRef.current);
    }
  }, []);

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
      setMensagemErro('Falha ao sincronizar dados administrativos do centro de controle.');
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
        exibirSucesso('Bacia hidrográfica atualizada com sucesso.');
      } else {
        await regiaoService.criar(formRegiao);
        exibirSucesso('Bacia hidrográfica incorporada com sucesso.');
      }
      setModalRegiaoAberto(false);
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Falha ao salvar parâmetros da região.');
    }
  };

  const alternarStatusRegiao = async (r: Regiao) => {
    try {
      if (r.ativo) {
        if (!window.confirm(`Desativar a bacia "${r.nome}"? Sensores e telemetria vinculados serão logicamente desativados.`)) return;
        await regiaoService.desativar(r.id);
        exibirSucesso(`Bacia "${r.nome}" desativada (soft delete).`);
      } else {
        await regiaoService.reativar(r.id);
        exibirSucesso(`Bacia "${r.nome}" reativada no centro de vigilância.`);
      }
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Erro ao modificar status da bacia.');
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
      exibirErro('Regra de Calibração: Limite Atenção deve ser menor que Alerta, que deve ser menor que Perigo.');
      return;
    }

    try {
      if (sensorEditandoId) {
        await sensorService.atualizar(sensorEditandoId, formSensor);
        exibirSucesso('Estação telemétrica atualizada.');
      } else {
        await sensorService.criar(formSensor);
        exibirSucesso('Novo sensor integrado com sucesso.');
      }
      setModalSensorAberto(false);
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Falha ao registrar sensor.');
    }
  };

  const alternarStatusSensor = async (s: Sensor) => {
    try {
      if (s.ativo) {
        if (!window.confirm(`Desativar o sensor "${s.codigoIdentificador}"? Ele cessará a ingestão de telemetria.`)) return;
        await sensorService.desativar(s.id);
        exibirSucesso(`Sensor "${s.codigoIdentificador}" desativado (soft delete).`);
      } else {
        await sensorService.reativar(s.id);
        exibirSucesso(`Sensor "${s.codigoIdentificador}" reativado na malha de coleta.`);
      }
      carregarDados();
    } catch (err: any) {
      exibirErro(err.response?.data?.message || 'Erro ao alterar status operacional do sensor.');
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.08em' }}>
              SEC://ADMIN.CONSOLE // ACESSO-RESTRITO
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Console Administrativo de Infraestrutura
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Controle de cadastro, calibração de limiares de risco e gerenciamento de exclusão lógica (soft delete)
          </p>
        </div>

        <div>
          {abaAtiva === 'regioes' ? (
            <button onClick={abrirCriarRegiao} className="btn btn-primary btn-sm">
              <Plus size={13} /> Cadastrar Nova Bacia
            </button>
          ) : (
            <button onClick={abrirCriarSensor} className="btn btn-primary btn-sm">
              <Plus size={13} /> Integrar Novo Sensor IoT
            </button>
          )}
        </div>
      </div>

      {mensagemSucesso && (
        <div className="status-banner status-banner-success">
          <CheckCircle2 size={16} />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="status-banner status-banner-error">
          <AlertCircle size={16} />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Seletor Tático de Abas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setAbaAtiva('regioes')}
          className={`btn btn-sm ${abaAtiva === 'regioes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem' }}
        >
          <MapPin size={13} /> Bacias Hidrográficas ({regioes.length})
        </button>
        <button
          onClick={() => setAbaAtiva('sensores')}
          className={`btn btn-sm ${abaAtiva === 'sensores' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem' }}
        >
          <Cpu size={13} /> Estações Telemétricas ({sensores.length})
        </button>
      </div>

      {/* ABA 1: REGIÕES */}
      {abaAtiva === 'regioes' && (
        <div className="panel" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="op-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Designação da Bacia</th>
                  <th>Município / UF</th>
                  <th>Severidade Vigente</th>
                  <th>Status de Vigilância</th>
                  <th style={{ textAlign: 'right' }}>Comandos de Gestão</th>
                </tr>
              </thead>
              <tbody>
                {regioes.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>#{r.id}</code>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{r.nome}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.cidade} / {r.estado}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.nivelRiscoAtual}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '2px',
                        background: r.ativo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: r.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)'
                      }}>
                        {r.ativo ? 'ATIVA' : 'INATIVA (SOFT DELETE)'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => abrirEditarRegiao(r)}
                          className="btn btn-secondary btn-sm"
                          title="Editar dados da bacia"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          <Edit2 size={11} /> Editar
                        </button>
                        {r.ativo ? (
                          <button
                            onClick={() => alternarStatusRegiao(r)}
                            className="btn btn-danger btn-sm"
                            title="Desativar região (exclusão lógica)"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            <Trash2 size={11} /> Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => alternarStatusRegiao(r)}
                            className="btn btn-success btn-sm"
                            title="Reativar bacia"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            <RefreshCw size={11} /> Reativar
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

      {/* ABA 2: SENSORES */}
      {abaAtiva === 'sensores' && (
        <div className="panel" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="op-table">
              <thead>
                <tr>
                  <th>Código de Estação</th>
                  <th>Modalidade</th>
                  <th>Bacia Vinculada</th>
                  <th>Limiares (Atenção / Alerta / Perigo)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Comandos de Gestão</th>
                </tr>
              </thead>
              <tbody>
                {sensores.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--cyan-telemetry)' }}>
                        {s.codigoIdentificador}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.tipo}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{s.nomeRegiao}</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--risk-atencao)' }}>{s.limiteAtencao}</span> /{' '}
                      <span style={{ color: 'var(--risk-alerta)' }}>{s.limiteAlerta}</span> /{' '}
                      <strong style={{ color: 'var(--risk-perigo)' }}>{s.limitePerigo} {s.unidadeMedida}</strong>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '2px',
                        background: s.ativo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: s.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)'
                      }}>
                        {s.ativo ? 'OPERACIONAL' : 'DESATIVADO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => abrirEditarSensor(s)}
                          className="btn btn-secondary btn-sm"
                          title="Editar sensor"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          <Edit2 size={11} /> Editar
                        </button>
                        {s.ativo ? (
                          <button
                            onClick={() => alternarStatusSensor(s)}
                            className="btn btn-danger btn-sm"
                            title="Desativar sensor (soft delete)"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            <Trash2 size={11} /> Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => alternarStatusSensor(s)}
                            className="btn btn-success btn-sm"
                            title="Reativar sensor"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            <RefreshCw size={11} /> Reativar
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

      {/* MODAL: REGIÃO */}
      {modalRegiaoAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {regiaoEditandoId ? 'Editar Bacia Hidrográfica' : 'Cadastrar Bacia Hidrográfica'}
              </h3>
              <button
                onClick={() => setModalRegiaoAberto(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={salvarRegiao}>
              <div style={{ padding: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Designação da Bacia ou Setor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formRegiao.nome}
                    onChange={(e) => setFormRegiao({ ...formRegiao, nome: e.target.value })}
                    placeholder="Ex: Bacia do Rio Tamanduateí"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Município</label>
                    <input
                      type="text"
                      className="form-input"
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
                      className="form-input"
                      value={formRegiao.estado}
                      maxLength={2}
                      onChange={(e) => setFormRegiao({ ...formRegiao, estado: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalRegiaoAberto(false)} className="btn btn-secondary btn-sm">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {regiaoEditandoId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SENSOR */}
      {modalSensorAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {sensorEditandoId ? 'Calibrar Estação Telemétrica' : 'Integrar Novo Sensor IoT'}
              </h3>
              <button
                onClick={() => setModalSensorAberto(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={salvarSensor}>
              <div style={{ padding: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Bacia Hidrográfica de Instalação</label>
                  <select
                    className="form-select"
                    value={formSensor.regiaoId}
                    onChange={(e) => setFormSensor({ ...formSensor, regiaoId: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Selecione uma bacia ativa...</option>
                    {regioes.filter(r => r.ativo).map((r) => (
                      <option key={r.id} value={r.id}>{r.nome} ({r.cidade}/{r.estado})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Código Único (Mnemônico)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formSensor.codigoIdentificador}
                      onChange={(e) => setFormSensor({ ...formSensor, codigoIdentificador: e.target.value.toUpperCase() })}
                      placeholder="Ex: PLUV-CENTRO-01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Coleta</label>
                    <select
                      className="form-select"
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
                      <option value="PLUVIOMETRO">Pluviômetro (mm/h)</option>
                      <option value="NIVEL_AGUA">Nível da Calha (m)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unidade de Medida</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSensor.unidadeMedida}
                    onChange={(e) => setFormSensor({ ...formSensor, unidadeMedida: e.target.value })}
                    placeholder="Ex: mm/h ou m"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--risk-atencao)' }}>Lim. Atenção</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
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
                      className="form-input"
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
                      className="form-input"
                      value={formSensor.limitePerigo}
                      onChange={(e) => setFormSensor({ ...formSensor, limitePerigo: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  * Protocolo AlertaJá: Limite Atenção &lt; Limite Alerta &lt; Limite Perigo.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalSensorAberto(false)} className="btn btn-secondary btn-sm">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {sensorEditandoId ? 'Salvar Calibração' : 'Concluir Integração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
