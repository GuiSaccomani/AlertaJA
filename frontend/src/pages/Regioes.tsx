import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { regiaoService } from '../services/api';
import { Regiao } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { MapPin, Search, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const Regioes: React.FC = () => {
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
        size: 10,
        sort: 'nome,asc'
      });
      setRegioes(res.content || []);
      setTotalPaginas(res.totalPages || 1);
      setTotalElementos(res.totalElements || 0);
    } catch (err: any) {
      setErro('Erro ao carregar lista de regiões.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRegioes();
  }, [pagina, apenasAtivas]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(0);
    carregarRegioes();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MapPin size={26} style={{ color: 'var(--primary)' }} />
            Regiões Monitoradas
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Bacias hidrográficas, córregos e setores de interesse civil cadastrados
          </p>
        </div>
      </div>

      {erro && (
        <div className="alert-box alert-box-error">
          <AlertCircle size={18} />
          <span>{erro}</span>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar região por nome..."
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={apenasAtivas}
              onChange={(e) => {
                setApenasAtivas(e.target.checked);
                setPagina(0);
              }}
            />
            Apenas regiões ativas
          </label>

          <button type="submit" className="btn btn-primary btn-sm">
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabela de Regiões */}
      <div className="card">
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : regioes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p>Nenhuma região encontrada com os filtros informados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome da Região</th>
                  <th>Localização</th>
                  <th>Risco Atual</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {regioes.map((regiao) => (
                  <tr key={regiao.id}>
                    <td>
                      <Link
                        to={`/regioes/${regiao.id}`}
                        style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}
                      >
                        {regiao.nome}
                      </Link>
                    </td>
                    <td>{regiao.cidade} - {regiao.estado}</td>
                    <td><RiskBadge nivel={regiao.nivelRiscoAtual} /></td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: regiao.ativo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: regiao.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)'
                      }}>
                        {regiao.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/regioes/${regiao.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Mostrando página {pagina + 1} de {totalPaginas} ({totalElementos} regiões)</span>
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
