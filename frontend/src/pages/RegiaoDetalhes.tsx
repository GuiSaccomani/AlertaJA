import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { regiaoService, sensorService, medicaoService } from '../services/api';
import { Regiao, Sensor, Medicao } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { animatePageEnter } from '../utils/motion';
import {
  MapPin,
  Cpu,
  Activity,
  ArrowLeft,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sliders
} from 'lucide-react';

export const RegiaoDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const regiaoId = Number(id);
  const containerRef = useRef<HTMLDivElement>(null);

  const [regiao, setRegiao] = useState<Regiao | null>(null);
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [paginaMedicoes, setPaginaMedicoes] = useState(0);
  const [totalPaginasMedicoes, setTotalPaginasMedicoes] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      animatePageEnter(containerRef.current);
    }
  }, []);

  useEffect(() => {
    const carregarDetalhes = async () => {
      if (!regiaoId) return;
      setCarregando(true);
      setErro(null);

      try {
        const [dadosRegiao, dadosSensores] = await Promise.all([
          regiaoService.obterPorId(regiaoId),
          sensorService.listar({ regiaoId, size: 50 })
        ]);
        setRegiao(dadosRegiao);
        setSensores(dadosSensores.content || []);
      } catch (err: any) {
        setErro('Falha ao obter os parâmetros e telemetria desta bacia hidrográfica.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDetalhes();
  }, [regiaoId]);

  useEffect(() => {
    const carregarMedicoes = async () => {
      if (!regiaoId) return;
      try {
        const res = await medicaoService.listar({
          regiaoId,
          page: paginaMedicoes,
          size: 10,
          sort: 'dataHora,desc'
        });
        setMedicoes(res.content || []);
        setTotalPaginasMedicoes(res.totalPages || 1);
      } catch (err) {
        console.error('Erro ao carregar histórico de medições:', err);
      }
    };

    carregarMedicoes();
  }, [regiaoId, paginaMedicoes]);

  if (carregando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
        <div className="spinner-op" />
        <span style={{ fontSize: '0.85rem' }}>Carregando estação de análise da bacia...</span>
      </div>
    );
  }

  if (erro || !regiao) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <AlertCircle size={40} style={{ color: 'var(--risk-perigo)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Bacia Hidrográfica Não Identificada</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {erro || 'O identificador solicitado não existe ou a bacia foi desativada.'}
        </p>
        <Link to="/regioes" className="btn btn-secondary">
          <ArrowLeft size={14} /> Retornar ao Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Botão de Retorno e Identificação Tática */}
      <div>
        <Link to="/regioes" className="btn btn-secondary btn-sm" style={{ marginBottom: '0.85rem' }}>
          <ArrowLeft size={12} /> Voltar para Bacias
        </Link>

        <div className="panel" style={{ borderLeft: `4px solid var(--risk-${regiao.nivelRiscoAtual.toLowerCase()})`, padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.06em' }}>
                  BACIA-ID #{regiao.id.toString().padStart(4, '0')} // DIRETORIA DE GESTÃO HIDROGRÁFICA
                </span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                {regiao.nome}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} style={{ color: 'var(--cyan-telemetry)' }} />
                  {regiao.cidade} / {regiao.estado}
                </span>
                <span>•</span>
                <span>Status de Vigilância: <strong style={{ color: regiao.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)', fontFamily: 'var(--font-mono)' }}>{regiao.ativo ? 'ATIVA' : 'INATIVA'}</strong></span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Severidade Avaliada
              </span>
              <RiskBadge nivel={regiao.nivelRiscoAtual} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Sensores de Campo Alocados */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Cpu size={15} style={{ color: 'var(--cyan-telemetry)' }} />
            Estações Telemétricas Alocadas ({sensores.length})
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            DISPOSITIVOS IoT
          </span>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {sensores.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Nenhum sensor vinculado a esta bacia no momento.
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Código da Estação</th>
                    <th>Tecnologia</th>
                    <th>Unidade</th>
                    <th>Limiar Atenção</th>
                    <th>Limiar Alerta</th>
                    <th>Limiar Perigo</th>
                    <th>Última Telemetria</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sensores.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <code style={{ fontWeight: 700, color: 'var(--cyan-telemetry)', fontSize: '0.82rem' }}>
                          {s.codigoIdentificador}
                        </code>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        {s.tipo === 'PLUVIOMETRO' ? 'Pluviômetro de Báscula' : 'Sensor Fluviométrico (Cota)'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{s.unidadeMedida}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--risk-atencao)' }}>
                        {s.limiteAtencao} {s.unidadeMedida}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--risk-alerta)' }}>
                        {s.limiteAlerta} {s.unidadeMedida}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--risk-perigo)' }}>
                        {s.limitePerigo} {s.unidadeMedida}
                      </td>
                      <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {s.ultimaLeitura ? new Date(s.ultimaLeitura).toLocaleString('pt-BR') : 'Aguardando telemetria'}
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
                          {s.ativo ? 'OPERACIONAL' : 'INATIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Técnico de Telemetria da Bacia */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={15} style={{ color: 'var(--cyan-telemetry)' }} />
            Registro Sequencial de Telemetria da Bacia
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {medicoes.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Nenhuma medição registrada para esta bacia ainda.
            </div>
          ) : (
            <>
              <div className="table-wrapper" style={{ border: 'none' }}>
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>Identificador do Sensor</th>
                      <th>Classificação</th>
                      <th>Magnitude Medida</th>
                      <th>Avaliação do Motor</th>
                      <th>Carimbo Temporal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicoes.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <code style={{ color: 'var(--cyan-telemetry)' }}>{m.codigoSensor}</code>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{m.tipoSensor}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-pure)' }}>
                          {m.valor} {m.unidadeMedida}
                        </td>
                        <td>
                          <RiskBadge nivel={m.nivelRiscoDetectado} size="sm" />
                        </td>
                        <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {new Date(m.dataHora).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPaginasMedicoes > 1 && (
                <div className="pagination-bar">
                  <span>Página {paginaMedicoes + 1} de {totalPaginasMedicoes}</span>
                  <div className="pagination-controls">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPaginaMedicoes((p) => Math.max(0, p - 1))}
                      disabled={paginaMedicoes === 0}
                    >
                      <ChevronLeft size={13} /> Anterior
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPaginaMedicoes((p) => Math.min(totalPaginasMedicoes - 1, p + 1))}
                      disabled={paginaMedicoes >= totalPaginasMedicoes - 1}
                    >
                      Próxima <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
