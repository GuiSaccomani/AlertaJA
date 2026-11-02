import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { regiaoService, alertaService, medicaoService, sensorService } from '../services/api';
import { Regiao, Alerta, Medicao, NivelRisco } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  Activity,
  AlertTriangle,
  MapPin,
  Cpu,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Radio
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [alertasAtivos, setAlertasAtivos] = useState<Alerta[]>([]);
  const [ultimasMedicoes, setUltimasMedicoes] = useState<Medicao[]>([]);
  const [totalSensores, setTotalSensores] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [atualizandoManual, setAtualizandoManual] = useState<boolean>(false);
  const [ultimoUpdate, setUltimoUpdate] = useState<Date>(new Date());
  const [segundosDesdeUpdate, setSegundosDesdeUpdate] = useState<number>(0);
  const [erro, setErro] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const carregarDados = useCallback(async (isManual: boolean = false) => {
    if (isManual) setAtualizandoManual(true);
    setErro(null);

    try {
      const [resRegioes, resAlertas, resMedicoes, resSensores] = await Promise.all([
        regiaoService.listar({ size: 100, ativo: true }),
        alertaService.listar({ ativo: true, size: 20 }),
        medicaoService.listar({ size: 10, sort: 'dataHora,desc' }),
        sensorService.listar({ size: 1, ativo: true })
      ]);

      setRegioes(resRegioes.content || []);
      setAlertasAtivos(resAlertas.content || []);
      setUltimasMedicoes(resMedicoes.content || []);
      setTotalSensores(resSensores.totalElements || 0);
      setUltimoUpdate(new Date());
      setSegundosDesdeUpdate(0);
    } catch (err: any) {
      console.error('Erro ao atualizar dashboard:', err);
      setErro('Não foi possível obter os dados mais recentes do backend.');
    } finally {
      setCarregando(false);
      if (isManual) {
        setTimeout(() => setAtualizandoManual(false), 500);
      }
    }
  }, []);

  // Polling automático estrito a cada 10 segundos
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

  // Calcula o maior nível de risco global entre as regiões ativas
  const calcularRiscoGlobal = (): NivelRisco => {
    if (regioes.some(r => r.nivelRiscoAtual === 'PERIGO')) return 'PERIGO';
    if (regioes.some(r => r.nivelRiscoAtual === 'ALERTA')) return 'ALERTA';
    if (regioes.some(r => r.nivelRiscoAtual === 'ATENCAO')) return 'ATENCAO';
    return 'NORMAL';
  };

  const riscoGlobal = calcularRiscoGlobal();

  return (
    <div>
      {/* Cabeçalho do Dashboard com Polling Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity size={28} style={{ color: 'var(--primary)' }} />
            Centro Integrado de Monitoramento
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Visão consolidada de riscos hidrológicos e telemetria de sensores em tempo real
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <Radio size={14} style={{ color: 'var(--risk-normal)', animation: 'pulseRisk 2s infinite' }} />
            <span>Atualização automática (10s)</span>
            <span>•</span>
            <span style={{ fontFamily: 'monospace' }}>há {segundosDesdeUpdate}s</span>
          </div>

          <button
            onClick={() => carregarDados(true)}
            className="btn btn-secondary btn-sm"
            disabled={atualizandoManual}
            title="Forçar sincronização com o backend"
          >
            <RefreshCw size={14} className={atualizandoManual ? 'spinner-sm' : ''} />
            Atualizar Agora
          </button>
        </div>
      </div>

      {erro && (
        <div className="alert-box alert-box-error">
          <AlertTriangle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {/* Cartões de Indicadores Chave (Métricas) */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: `4px solid var(--risk-${riscoGlobal.toLowerCase()})` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Risco Geral Monitorado
              </p>
              <div style={{ marginTop: '0.5rem' }}>
                <RiskBadge nivel={riscoGlobal} />
              </div>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={24} style={{ color: `var(--risk-${riscoGlobal.toLowerCase()})` }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
            Maior nível entre as bacias ativas
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Alertas Ativos
              </p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem', color: alertasAtivos.length > 0 ? 'var(--risk-alerta)' : 'var(--text-main)' }}>
                {alertasAtivos.length}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(249, 115, 22, 0.12)', borderRadius: 'var(--radius-sm)' }}>
              <AlertTriangle size={24} style={{ color: 'var(--risk-alerta)' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
            Situações em andamento
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Regiões Monitoradas
              </p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {regioes.length}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(6, 182, 212, 0.12)', borderRadius: 'var(--radius-sm)' }}>
              <MapPin size={24} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
            Bacias e setores cadastrados
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Sensores em Operação
              </p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {totalSensores}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.12)', borderRadius: 'var(--radius-sm)' }}>
              <Cpu size={24} style={{ color: 'var(--secondary)' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
            Pluviômetros e fluviômetros
          </p>
        </div>
      </div>

      {/* Seção 1: Alertas Ativos no Momento */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <AlertTriangle size={20} style={{ color: 'var(--risk-atencao)' }} />
            Alertas em Aberto no Momento
          </h2>
          <Link to="/alertas" className="btn btn-secondary btn-sm">
            Central Completa <ArrowRight size={14} />
          </Link>
        </div>

        {alertasAtivos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={42} style={{ color: 'var(--risk-normal)', margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Nenhum alerta ativo no momento
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '420px', margin: '0.25rem auto 0' }}>
              Todas as leituras de telemetria meteorológica e hidrológica estão operando dentro dos limites de normalidade.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nível</th>
                  <th>Região</th>
                  <th>Sensor</th>
                  <th>Título do Alerta</th>
                  <th>Primeira Ocorrência</th>
                  <th>Última Ocorrência</th>
                </tr>
              </thead>
              <tbody>
                {alertasAtivos.map((alerta) => (
                  <tr key={alerta.id}>
                    <td><RiskBadge nivel={alerta.nivel} /></td>
                    <td>
                      <Link to={`/regioes/${alerta.regiaoId}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                        {alerta.nomeRegiao}
                      </Link>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {alerta.codigoSensor}
                      </code>
                    </td>
                    <td style={{ fontWeight: 500 }}>{alerta.titulo}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(alerta.dataEmissao).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {alerta.dataUltimaOcorrencia ? new Date(alerta.dataUltimaOcorrencia).toLocaleString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seção 2: Grid de Regiões Monitoradas e Últimas Medições */}
      <div className="grid grid-cols-2">
        {/* Painel de Regiões */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <MapPin size={20} style={{ color: 'var(--primary)' }} />
              Situação por Região
            </h2>
            <Link to="/regioes" className="btn btn-secondary btn-sm">
              Ver Todas <ArrowRight size={14} />
            </Link>
          </div>

          {regioes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
              Nenhuma região cadastrada no sistema.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {regioes.slice(0, 5).map((regiao) => (
                <div
                  key={regiao.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <Link
                      to={`/regioes/${regiao.id}`}
                      style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}
                    >
                      {regiao.nome}
                    </Link>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {regiao.cidade} - {regiao.estado}
                    </p>
                  </div>
                  <RiskBadge nivel={regiao.nivelRiscoAtual} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel das Últimas Medições */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Clock size={20} style={{ color: 'var(--secondary)' }} />
              Últimas Medições (Telemetria IoT)
            </h2>
          </div>

          {ultimasMedicoes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
              Nenhuma medição registrada até o momento.
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sensor</th>
                    <th>Valor</th>
                    <th>Nível</th>
                    <th>Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasMedicoes.slice(0, 6).map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.codigoSensor}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{m.tipoSensor}</div>
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {m.valor} {m.unidadeMedida}
                      </td>
                      <td>
                        <RiskBadge nivel={m.nivelRiscoDetectado} />
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(m.dataHora).toLocaleTimeString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
