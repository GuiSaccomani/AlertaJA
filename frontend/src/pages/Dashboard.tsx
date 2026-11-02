import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { regiaoService, alertaService, medicaoService, sensorService } from '../services/api';
import { Regiao, Alerta, Medicao, NivelRisco } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { animatePageEnter, animateDataTick } from '../utils/motion';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Radio,
  Cpu,
  MapPin,
  TrendingUp,
  Droplets,
  Waves,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [alertasAtivos, setAlertasAtivos] = useState<Alerta[]>([]);
  const [ultimasMedicoes, setUltimasMedicoes] = useState<Medicao[]>([]);
  const [totalSensores, setTotalSensores] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [atualizandoManual, setAtualizandoManual] = useState<boolean>(false);
  const [segundosDesdeUpdate, setSegundosDesdeUpdate] = useState<number>(0);
  const [tipoGrafico, setTipoGrafico] = useState<'CHUVA' | 'RIO'>('CHUVA');
  const [erro, setErro] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLSpanElement>(null);

  const carregarDados = useCallback(async (isManual: boolean = false) => {
    if (isManual) setAtualizandoManual(true);
    setErro(null);

    try {
      const [resRegioes, resAlertas, resMedicoes, resSensores] = await Promise.all([
        regiaoService.listar({ size: 100, ativo: true }),
        alertaService.listar({ ativo: true, size: 20 }),
        medicaoService.listar({ size: 15, sort: 'dataHora,desc' }),
        sensorService.listar({ size: 1, ativo: true })
      ]);

      setRegioes(resRegioes.content || []);
      setAlertasAtivos(resAlertas.content || []);
      setUltimasMedicoes(resMedicoes.content || []);
      setTotalSensores(resSensores.totalElements || 0);
      setSegundosDesdeUpdate(0);

      if (tickerRef.current) {
        animateDataTick(tickerRef.current);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar dashboard:', err);
      setErro('Falha na comunicação com o Centro de Telemetria do AlertaJá.');
    } finally {
      setCarregando(false);
      if (isManual) {
        setTimeout(() => setAtualizandoManual(false), 450);
      }
    }
  }, []);

  // Animação de entrada da página
  useEffect(() => {
    if (containerRef.current) {
      animatePageEnter(containerRef.current);
    }
  }, []);

  // Polling automático a cada 10 segundos
  useEffect(() => {
    carregarDados();

    const intervalId = window.setInterval(() => {
      carregarDados();
    }, 10000);

    const tickerId = window.setInterval(() => {
      setSegundosDesdeUpdate((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(tickerId);
    };
  }, [carregarDados]);

  // Calcula o risco global da rede
  const calcularRiscoGlobal = (): NivelRisco => {
    if (regioes.some(r => r.nivelRiscoAtual === 'PERIGO')) return 'PERIGO';
    if (regioes.some(r => r.nivelRiscoAtual === 'ALERTA')) return 'ALERTA';
    if (regioes.some(r => r.nivelRiscoAtual === 'ATENCAO')) return 'ATENCAO';
    return 'NORMAL';
  };

  const riscoGlobal = calcularRiscoGlobal();

  // Filtra dados para o gráfico técnico
  const medicoesGrafico = ultimasMedicoes
    .filter(m => (tipoGrafico === 'CHUVA' ? m.tipoSensor === 'PLUVIOMETRO' : m.tipoSensor === 'NIVEL_AGUA'))
    .slice(0, 8)
    .reverse();

  // Valores máximos e mínimos para dimensionamento do gráfico SVG
  const maxValor = Math.max(...medicoesGrafico.map(m => m.valor), tipoGrafico === 'CHUVA' ? 60 : 5);
  const minValor = 0;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. CABEÇALHO TÁTICO DE OPERAÇÕES */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.08em' }}>
              SYS://TELEMETRIA.REDE-NACIONAL
            </span>
            <span style={{ color: 'var(--border-default)' }}>|</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              POSTO DE VIGILÂNCIA HIDROLÓGICA
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Painel Geral de Situação Hidrológica
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.4rem 0.75rem',
              background: 'var(--bg-subpanel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-strict)',
              fontSize: '0.75rem'
            }}
          >
            <Radio size={12} style={{ color: 'var(--cyan-telemetry)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Polling 10s:</span>
            <span ref={tickerRef} style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
              há {segundosDesdeUpdate}s
            </span>
          </div>

          <button
            onClick={() => carregarDados(true)}
            className="btn btn-secondary btn-sm"
            disabled={atualizandoManual}
            title="Sincronizar telemetria imediatamente"
          >
            <RefreshCw size={12} className={atualizandoManual ? 'spinner-op' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {erro && (
        <div className="status-banner status-banner-error">
          <AlertTriangle size={16} />
          <span>{erro}</span>
        </div>
      )}

      {/* 2. BARRA INTEGRADA DE RISCO GLOBAL E DIAGNÓSTICO DA REDE (ASSIMÉTRICA) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
        {/* Bloco Esquerdo: Painel de Alarme e Risco Geral */}
        <div
          className="panel"
          style={{
            borderLeft: `4px solid var(--risk-${riscoGlobal.toLowerCase()})`,
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div className="crosshair-corner crosshair-tr" />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ÍNDICE CONSOLIDADO DE VULNERABILIDADE
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.35rem' }}>
                  <RiskBadge nivel={riscoGlobal} size="lg" />
                  <span style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {riscoGlobal === 'PERIGO' && 'Transbordamento iminente ou calha excedida'}
                    {riscoGlobal === 'ALERTA' && 'Volume elevado com risco severo de inundação'}
                    {riscoGlobal === 'ATENCAO' && 'Elevação pluviométrica acima dos limiares normais'}
                    {riscoGlobal === 'NORMAL' && 'Todas as bacias em regime de vazão estável'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '0.45rem 0.85rem',
                  background: 'var(--bg-subpanel)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-strict)',
                  textAlign: 'right'
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Bacias Ativas</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cyan-telemetry)' }}>
                  {regioes.length}
                </div>
              </div>
            </div>

            {/* Régua Tática de Severidade */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                <span>REGIME NORMAL</span>
                <span>LIMIAR DE ATENÇÃO</span>
                <span>REGIME DE ALERTA</span>
                <span>PERIGO CRÍTICO</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', height: '6px' }}>
                <div style={{ background: riscoGlobal === 'NORMAL' || riscoGlobal === 'ATENCAO' || riscoGlobal === 'ALERTA' || riscoGlobal === 'PERIGO' ? 'var(--risk-normal)' : 'var(--border-subtle)', borderRadius: '1px' }} />
                <div style={{ background: riscoGlobal === 'ATENCAO' || riscoGlobal === 'ALERTA' || riscoGlobal === 'PERIGO' ? 'var(--risk-atencao)' : 'var(--border-subtle)', borderRadius: '1px' }} />
                <div style={{ background: riscoGlobal === 'ALERTA' || riscoGlobal === 'PERIGO' ? 'var(--risk-alerta)' : 'var(--border-subtle)', borderRadius: '1px' }} />
                <div style={{ background: riscoGlobal === 'PERIGO' ? 'var(--risk-perigo)' : 'var(--border-subtle)', borderRadius: '1px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>
              {alertasAtivos.length > 0 ? (
                <strong style={{ color: 'var(--risk-alerta)' }}>{alertasAtivos.length} incidente(s) hidrológico(s) aberto(s)</strong>
              ) : (
                <span style={{ color: 'var(--risk-normal)' }}>Rede hidrológica operando sem inconformidades críticas</span>
              )}
            </span>
            <Link to="/alertas" style={{ color: 'var(--cyan-telemetry)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 500 }}>
              Inspeção de Alertas <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Bloco Direito: Diagnóstico da Infraestrutura IoT */}
        <div className="panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              DIAGNÓSTICO DA INFRAESTRUTURA
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-subpanel)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-strict)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                  <Cpu size={13} style={{ color: 'var(--cyan-telemetry)' }} />
                  ESTAÇÕES IoT
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-pure)', marginTop: '0.2rem' }}>
                  {totalSensores}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Dispositivos operacionais</div>
              </div>

              <div style={{ background: 'var(--bg-subpanel)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-strict)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                  <AlertTriangle size={13} style={{ color: alertasAtivos.length > 0 ? 'var(--risk-alerta)' : 'var(--text-dim)' }} />
                  EVENTOS CRÍTICOS
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: alertasAtivos.length > 0 ? 'var(--risk-alerta)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {alertasAtivos.length}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Sob resolução imediata</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            <span>Protocolo de Ingestão: API Key V1</span>
            <span style={{ color: 'var(--risk-normal)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--risk-normal)', borderRadius: '50%' }} />
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE ANÁLISE HIDROLÓGICA (GRÁFICO TÉCNICO + RADAR DE INCIDENTES) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
        {/* Coluna Esquerda: Gráfico Técnico de Telemetria e Matriz Geográfica */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Gráfico Técnico em SVG Nativo */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <TrendingUp size={15} style={{ color: 'var(--cyan-telemetry)' }} />
                Evolução Temporal da Telemetria (Últimas Transmissões)
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => setTipoGrafico('CHUVA')}
                  className={`btn btn-sm ${tipoGrafico === 'CHUVA' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  <Droplets size={12} />
                  Chuva (mm/h)
                </button>
                <button
                  onClick={() => setTipoGrafico('RIO')}
                  className={`btn btn-sm ${tipoGrafico === 'RIO' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  <Waves size={12} />
                  Nível Fluvial (m)
                </button>
              </div>
            </div>

            <div className="panel-body">
              {medicoesGrafico.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
                  <Activity size={32} style={{ color: 'var(--border-default)', margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>Nenhum dado telemétrico recente para o parâmetro selecionado.</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    Aguardando pacotes do simulador de sensores IoT.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                    <span>Eixo Vertical: {tipoGrafico === 'CHUVA' ? 'Intensidade Pluviométrica (mm/h)' : 'Cota Fluvial (metros)'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>Pico recente: {Math.max(...medicoesGrafico.map(m => m.valor)).toFixed(2)} {tipoGrafico === 'CHUVA' ? 'mm/h' : 'm'}</span>
                  </div>

                  {/* SVG Chart Técnico com Grid e Curva */}
                  <div style={{ width: '100%', height: '170px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-strict)', padding: '0.75rem', position: 'relative' }}>
                    <svg viewBox="0 0 500 130" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      {/* Linhas de Grade Técnicas */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                      <line x1="0" y1="65" x2="500" y2="65" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                      <line x1="0" y1="110" x2="500" y2="110" stroke="var(--border-subtle)" />

                      {/* Polígono de Área */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--cyan-telemetry)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--cyan-telemetry)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Traçado da Curva com Coordenadas Proporcionais */}
                      {(() => {
                        const stepX = 500 / Math.max(medicoesGrafico.length - 1, 1);
                        const points = medicoesGrafico.map((m, idx) => {
                          const x = idx * stepX;
                          const norm = (m.valor - minValor) / (maxValor - minValor || 1);
                          const y = 110 - norm * 90;
                          return { x, y, val: m.valor, sensor: m.codigoSensor };
                        });

                        const pathData = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '');
                        const areaData = `${pathData} L ${points[points.length - 1]?.x || 0} 110 L 0 110 Z`;

                        return (
                          <>
                            <path d={areaData} fill="url(#chartGradient)" />
                            <path d={pathData} fill="none" stroke="var(--cyan-telemetry)" strokeWidth="2" />
                            {points.map((pt, i) => (
                              <g key={i}>
                                <circle cx={pt.x} cy={pt.y} r="3.5" fill="var(--bg-canvas)" stroke="var(--cyan-telemetry)" strokeWidth="2" />
                                <text x={pt.x} y={pt.y - 8} fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">
                                  {pt.val.toFixed(1)}
                                </text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                    {medicoesGrafico.map((m, i) => (
                      <span key={i}>
                        {new Date(m.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Matriz de Bacias Hidrográficas Monitoradas */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <MapPin size={15} style={{ color: 'var(--primary)' }} />
                Matriz de Bacias e Setores Urbanos
              </div>
              <Link to="/regioes" className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem' }}>
                Ver Todas <ArrowRight size={11} />
              </Link>
            </div>

            <div className="panel-body" style={{ padding: 0 }}>
              {regioes.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  Nenhuma região cadastrada no sistema.
                </div>
              ) : (
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>Bacia Hidrográfica</th>
                      <th>Localização</th>
                      <th>Classificação de Risco</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regioes.slice(0, 4).map(regiao => (
                      <tr key={regiao.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-pure)' }}>
                          <Link to={`/regioes/${regiao.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {regiao.nome}
                          </Link>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          {regiao.cidade} / {regiao.estado}
                        </td>
                        <td>
                          <RiskBadge nivel={regiao.nivelRiscoAtual} size="sm" />
                        </td>
                        <td>
                          <Link to={`/regioes/${regiao.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
                            <Eye size={11} /> Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Fila Operacional de Alertas e Feed de Telemetria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Incidentes Hidrológicos em Aberto */}
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">
                <AlertTriangle size={15} style={{ color: 'var(--risk-atencao)' }} />
                Incidentes em Aberto
              </div>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-subpanel)', padding: '0.15rem 0.45rem', borderRadius: '2px', border: '1px solid var(--border-subtle)' }}>
                {alertasAtivos.length} ATIVOS
              </span>
            </div>

            <div className="panel-body" style={{ maxHeight: '330px', overflowY: 'auto' }}>
              {alertasAtivos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-tertiary)' }}>
                  <CheckCircle2 size={36} style={{ color: 'var(--risk-normal)', margin: '0 auto 0.5rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                    Sem alertas ativos
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '280px', margin: '0.2rem auto 0' }}>
                    Todas as cotas hidrológicas e índices de saturação estão sob conformidade.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {alertasAtivos.map(alerta => (
                    <div
                      key={alerta.id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-subpanel)',
                        border: '1px solid var(--border-subtle)',
                        borderLeft: `3px solid var(--risk-${alerta.nivel.toLowerCase()})`,
                        borderRadius: 'var(--radius-strict)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <RiskBadge nivel={alerta.nivel} size="sm" />
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                          {new Date(alerta.dataEmissao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-pure)' }}>
                        {alerta.titulo}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Região: <strong>{alerta.nomeRegiao}</strong> | Sensor: <code style={{ color: 'var(--cyan-telemetry)' }}>{alerta.codigoSensor}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Feed de Telemetria IoT */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <Clock size={15} style={{ color: 'var(--text-tertiary)' }} />
                Fluxo Recente de Telemetria
              </div>
            </div>

            <div className="panel-body" style={{ padding: 0 }}>
              {ultimasMedicoes.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                  Aguardando leituras...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {ultimasMedicoes.slice(0, 5).map(m => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {m.codigoSensor}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          {m.tipoSensor === 'PLUVIOMETRO' ? 'Pluviômetro' : 'Nível Fluvial'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan-telemetry)' }}>
                          {m.valor} {m.unidadeMedida}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          {new Date(m.dataHora).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
