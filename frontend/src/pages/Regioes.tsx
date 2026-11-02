import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { regiaoService } from '../services/api';
import { Regiao } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { animatePageEnter } from '../utils/motion';
import { MapPin, Search, Eye, AlertCircle, ChevronLeft, ChevronRight, Layers, ArrowRight } from 'lucide-react';

export const Regioes: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [busca, setBusca] = useState('');
  const [apenasAtivas, setApenasAtivas] = useState(true);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarRegioes = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await regiaoService.listar({
        nome: busca.trim() || undefined,
        ativo: apenasAtivas ? true : undefined,
        page: pagina,
        size: 9,
        sort: 'nome,asc'
      });
      setRegioes(res.content || []);
      setTotalPaginas(res.totalPages || 1);
      setTotalElementos(res.totalElements || 0);
    } catch (err: any) {
      setErro('Falha ao consultar catálogo de bacias hidrográficas.');
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
    carregarRegioes();
  }, [pagina, apenasAtivas]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(0);
    carregarRegioes();
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.08em' }}>
              GEO.HYDRO // BACIAS-MONITORADAS
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Regiões e Bacias Hidrográficas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Setores territoriais, bacias de drenagem e corpos d'água sob monitoramento telemétrico
          </p>
        </div>
      </div>

      {erro && (
        <div className="status-banner status-banner-error">
          <AlertCircle size={16} />
          <span>{erro}</span>
        </div>
      )}

      {/* Barra de Filtros e Pesquisa */}
      <div className="panel" style={{ padding: '0.85rem 1.25rem' }}>
        <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar bacia por designação..."
              style={{ width: '100%', paddingLeft: '2.4rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={apenasAtivas}
              onChange={(e) => {
                setApenasAtivas(e.target.checked);
                setPagina(0);
              }}
              style={{ accentColor: 'var(--cyan-telemetry)' }}
            />
            Exibir apenas bacias ativas
          </label>

          <button type="submit" className="btn btn-primary btn-sm">
            Filtrar Bacias
          </button>
        </form>
      </div>

      {/* Grade Tática de Bacias Hidrográficas (Grid Editorial) */}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
          <div className="spinner-op" />
          <span style={{ fontSize: '0.82rem' }}>Mapeando bacias monitoradas...</span>
        </div>
      ) : regioes.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-tertiary)' }}>
          <Layers size={36} style={{ color: 'var(--border-default)', margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Nenhuma região encontrada</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Tente outro termo de busca ou habilite a exibição de bacias inativas.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {regioes.map((regiao) => (
            <div
              key={regiao.id}
              className="panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                borderLeft: `3px solid var(--risk-${regiao.nivelRiscoAtual.toLowerCase()})`
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                    BACIA-ID #{regiao.id.toString().padStart(3, '0')}
                  </span>
                  <RiskBadge nivel={regiao.nivelRiscoAtual} size="sm" />
                </div>

                <Link
                  to={`/regioes/${regiao.id}`}
                  style={{ textDecoration: 'none', color: 'var(--text-pure)', fontSize: '1.1rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}
                >
                  {regiao.nome}
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  <MapPin size={12} style={{ color: 'var(--cyan-telemetry)' }} />
                  <span>{regiao.cidade} / {regiao.estado}</span>
                </div>

                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.65rem', background: 'var(--bg-subpanel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-strict)', fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status Operacional:</span>
                  <span style={{ color: regiao.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {regiao.ativo ? 'ATIVA' : 'INATIVA'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <Link to={`/regioes/${regiao.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                  <Eye size={12} /> Visualizar Inteligência da Bacia <ArrowRight size={11} style={{ marginLeft: 'auto' }} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="panel" style={{ padding: 0 }}>
          <div className="pagination-bar">
            <span>
              Página {pagina + 1} de {totalPaginas} ({totalElementos} bacias cadastradas)
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
        </div>
      )}
    </div>
  );
};
