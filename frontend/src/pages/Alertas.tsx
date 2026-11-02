import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { alertaService } from '../services/api';
import { Alerta, NivelRisco, StatusAlerta } from '../types';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/RiskBadge';
import { animatePageEnter } from '../utils/motion';
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  RefreshCw,
  Search
} from 'lucide-react';

export const Alertas: React.FC = () => {
  const { isAdmin } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [apenasAtivos, setApenasAtivos] = useState<boolean>(true);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [processandoResolucaoId, setProcessandoResolucaoId] = useState<number | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const carregarAlertas = async () => {
    setCarregando(true);
    try {
      const res = await alertaService.listar({
        nivel: filtroNivel ? (filtroNivel as NivelRisco) : undefined,
        status: filtroStatus ? (filtroStatus as StatusAlerta) : undefined,
        ativo: apenasAtivos ? true : undefined,
        page: pagina,
        size: 10,
        sort: 'dataEmissao,desc'
      });
      setAlertas(res.content || []);
      setTotalPaginas(res.totalPages || 1);
      setTotalElementos(res.totalElements || 0);
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      animatePageEnter(containerRef.current);
    }
  }, []);

  useEffect(() => {
    carregarAlertas();
  }, [pagina, filtroNivel, filtroStatus, apenasAtivos]);

  const handleResolverManual = async (id: number) => {
    if (!window.confirm(`Confirma a resolução manual do Alerta #${id}? Esta ação será registrada no histórico de auditoria.`)) {
      return;
    }

    setProcessandoResolucaoId(id);
    try {
      await alertaService.resolverManualmente(id);
      setMensagemSucesso(`Incidente #${id} resolvido com sucesso.`);
      setTimeout(() => setMensagemSucesso(null), 3000);
      carregarAlertas();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao resolver alerta manualmente.');
    } finally {
      setProcessandoResolucaoId(null);
    }
  };

  const getStatusBadge = (status: StatusAlerta) => {
    switch (status) {
      case 'ATIVO':
        return (
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            EM ABERTO
          </span>
        );
      case 'RESOLVIDO_AUTO':
        return (
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            RESOLVIDO (AUTO)
          </span>
        );
      case 'RESOLVIDO_MANUAL':
        return (
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '2px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.35)' }}>
            RESOLVIDO (MANUAL)
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabeçalho Operacional da Página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.08em' }}>
              INCIDENT.MANAGEMENT // LOG-DE-EVENTOS
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Central Integrada de Alertas e Ocorrências
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Registro cronológico e rastreabilidade dos alertas emitidos pelo motor hidrológico
          </p>
        </div>

        <button onClick={carregarAlertas} className="btn btn-secondary btn-sm" disabled={carregando}>
          <RefreshCw size={12} className={carregando ? 'spinner-op' : ''} />
          Atualizar Lista
        </button>
      </div>

      {mensagemSucesso && (
        <div className="status-banner status-banner-success">
          <CheckCircle size={15} />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Barra de Filtros e Seletores Técnicos */}
      <div className="panel" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Filter size={14} style={{ color: 'var(--cyan-telemetry)' }} />
            Filtrar Registros:
          </div>

          <div style={{ minWidth: '170px' }}>
            <select
              className="form-select"
              style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              value={filtroNivel}
              onChange={(e) => { setFiltroNivel(e.target.value); setPagina(0); }}
            >
              <option value="">Todos os Níveis de Risco</option>
              <option value="NORMAL">Normal</option>
              <option value="ATENCAO">Atenção</option>
              <option value="ALERTA">Alerta</option>
              <option value="PERIGO">Perigo Crítico</option>
            </select>
          </div>

          <div style={{ minWidth: '190px' }}>
            <select
              className="form-select"
              style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value); setPagina(0); }}
            >
              <option value="">Todos os Status de Incidente</option>
              <option value="ATIVO">Apenas Ativos (Em Aberto)</option>
              <option value="RESOLVIDO_AUTO">Resolvidos pelo Sistema</option>
              <option value="RESOLVIDO_MANUAL">Resolvidos Manualmente</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
            <input
              type="checkbox"
              checked={apenasAtivos}
              onChange={(e) => { setApenasAtivos(e.target.checked); setPagina(0); }}
              style={{ accentColor: 'var(--cyan-telemetry)' }}
            />
            Ocultar incidentes encerrados
          </label>
        </div>
      </div>

      {/* Tabela de Incidentes */}
      <div className="panel" style={{ padding: 0 }}>
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3.5rem', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
            <div className="spinner-op" />
            <span style={{ fontSize: '0.82rem' }}>Consultando base de incidentes...</span>
          </div>
        ) : alertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-tertiary)' }}>
            <ShieldCheck size={36} style={{ color: 'var(--risk-normal)', margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              Nenhum incidente corresponde aos filtros aplicados
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Modifique os seletores de nível ou status para expandir a consulta.
            </p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="op-table">
              <thead>
                <tr>
                  <th>Severidade</th>
                  <th>Bacia / Região</th>
                  <th>Estação / Sensor</th>
                  <th>Descrição Técnica do Evento</th>
                  <th>Situação</th>
                  <th>Carimbo de Emissão</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Ação de Defesa</th>}
                </tr>
              </thead>
              <tbody>
                {alertas.map((alerta) => (
                  <tr key={alerta.id}>
                    <td>
                      <RiskBadge nivel={alerta.nivel} size="sm" />
                    </td>
                    <td>
                      <Link to={`/regioes/${alerta.regiaoId}`} style={{ color: 'var(--text-pure)', fontWeight: 600, textDecoration: 'none' }}>
                        {alerta.nomeRegiao}
                      </Link>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--cyan-telemetry)' }}>
                        {alerta.codigoSensor}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-pure)', fontSize: '0.82rem' }}>
                        {alerta.titulo}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: '380px', marginTop: '0.15rem' }}>
                        {alerta.descricao}
                      </div>
                      {alerta.dataUltimaOcorrencia && alerta.dataUltimaOcorrencia !== alerta.dataEmissao && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--risk-atencao)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                          Última leitura acima do limiar: {new Date(alerta.dataUltimaOcorrencia).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(alerta.status)}</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      <div>{new Date(alerta.dataEmissao).toLocaleString('pt-BR')}</div>
                      {alerta.dataResolucao && (
                        <div style={{ color: '#34d399', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                          Fim: {new Date(alerta.dataResolucao).toLocaleTimeString('pt-BR')}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {alerta.ativo ? (
                          <button
                            onClick={() => handleResolverManual(alerta.id)}
                            className="btn btn-secondary btn-sm"
                            disabled={processandoResolucaoId === alerta.id}
                            title="Resolver manualmente e cessar alerta"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                          >
                            <Check size={12} style={{ color: 'var(--risk-normal)' }} />
                            Resolver
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>ENCERRADO</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Barra de Paginação Operacional */}
        {totalPaginas > 1 && (
          <div className="pagination-bar">
            <span>
              Registro {pagina * 10 + 1} - {Math.min((pagina + 1) * 10, totalElementos)} de <strong>{totalElementos}</strong> alertas
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
              >
                <ChevronLeft size={13} /> Anterior
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1}
              >
                Próxima <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
