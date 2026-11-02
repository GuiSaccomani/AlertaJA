import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { alertaService } from '../services/api';
import { Alerta, NivelRisco, StatusAlerta } from '../types';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/RiskBadge';
import {
  AlertOctagon,
  CheckCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export const Alertas: React.FC = () => {
  const { isAdmin } = useAuth();

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
    carregarAlertas();
  }, [pagina, filtroNivel, filtroStatus, apenasAtivos]);

  const handleResolverManual = async (id: number) => {
    if (!window.confirm(`Deseja realmente marcar o Alerta #${id} como resolvido manualmente?`)) {
      return;
    }

    setProcessandoResolucaoId(id);
    try {
      await alertaService.resolverManualmente(id);
      setMensagemSucesso(`Alerta #${id} resolvido com sucesso.`);
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
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            EM ABERTO
          </span>
        );
      case 'RESOLVIDO_AUTO':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            RESOLVIDO (AUTO)
          </span>
        );
      case 'RESOLVIDO_MANUAL':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            RESOLVIDO (MANUAL)
          </span>
        );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertOctagon size={26} style={{ color: 'var(--risk-alerta)' }} />
            Central de Alertas e Ocorrências
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Acompanhamento, rastreabilidade e histórico dos incidentes detectados pelo motor de alertas
          </p>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="alert-box alert-box-success">
          <CheckCircle size={18} />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Painel de Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Filter size={16} />
            <strong>Filtros:</strong>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="select"
              value={filtroNivel}
              onChange={(e) => { setFiltroNivel(e.target.value); setPagina(0); }}
            >
              <option value="">Todos os Níveis</option>
              <option value="NORMAL">Normal</option>
              <option value="ATENCAO">Atenção</option>
              <option value="ALERTA">Alerta</option>
              <option value="PERIGO">Perigo Crítico</option>
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="select"
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value); setPagina(0); }}
            >
              <option value="">Todos os Status</option>
              <option value="ATIVO">Ativo (Em aberto)</option>
              <option value="RESOLVIDO_AUTO">Resolvido Automaticamente</option>
              <option value="RESOLVIDO_MANUAL">Resolvido Manualmente</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={apenasAtivos}
              onChange={(e) => { setApenasAtivos(e.target.checked); setPagina(0); }}
            />
            Apenas alertas ativos
          </label>
        </div>
      </div>

      {/* Tabela de Alertas */}
      <div className="card">
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : alertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={40} style={{ color: 'var(--risk-normal)', margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Nenhum alerta encontrado com os filtros selecionados</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nível</th>
                  <th>Região</th>
                  <th>Sensor</th>
                  <th>Título & Ocorrência</th>
                  <th>Status</th>
                  <th>Emissão / Resolução</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Ação Admin</th>}
                </tr>
              </thead>
              <tbody>
                {alertas.map((alerta) => (
                  <tr key={alerta.id}>
                    <td><RiskBadge nivel={alerta.nivel} /></td>
                    <td>
                      <Link to={`/regioes/${alerta.regiaoId}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        {alerta.nomeRegiao}
                      </Link>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem' }}>{alerta.codigoSensor}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{alerta.titulo}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', maxWidth: '320px' }}>
                        {alerta.descricao}
                      </div>
                      {alerta.dataUltimaOcorrencia && alerta.dataUltimaOcorrencia !== alerta.dataEmissao && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--risk-atencao)', marginTop: '0.2rem' }}>
                          Última reincidência: {new Date(alerta.dataUltimaOcorrencia).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(alerta.status)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>Emissão: {new Date(alerta.dataEmissao).toLocaleString('pt-BR')}</div>
                      {alerta.dataResolucao && (
                        <div style={{ color: '#34d399' }}>
                          Resolução: {new Date(alerta.dataResolucao).toLocaleString('pt-BR')}
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
                            title="Resolver manualmente este alerta"
                          >
                            <Check size={14} style={{ color: 'var(--risk-normal)' }} />
                            Resolver
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Encerrado</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Mostrando página {pagina + 1} de {totalPaginas} ({totalElementos} alertas)</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1}
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
