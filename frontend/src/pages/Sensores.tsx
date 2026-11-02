import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sensorService, regiaoService } from '../services/api';
import { Sensor, Regiao } from '../types';
import {
  Cpu,
  MapPin,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Sensores: React.FC = () => {
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [regiaoFiltroId, setRegiaoFiltroId] = useState<string>('');
  const [apenasAtivos, setApenasAtivos] = useState<boolean>(true);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarRegioes = async () => {
      try {
        const res = await regiaoService.listar({ size: 100, ativo: true });
        setRegioes(res.content || []);
      } catch (err) {
        console.error('Erro ao carregar regiões para filtro:', err);
      }
    };
    carregarRegioes();
  }, []);

  const carregarSensores = async () => {
    setCarregando(true);
    try {
      const res = await sensorService.listar({
        regiaoId: regiaoFiltroId ? Number(regiaoFiltroId) : undefined,
        ativo: apenasAtivos ? true : undefined,
        page: pagina,
        size: 10,
        sort: 'codigoIdentificador,asc'
      });
      setSensores(res.content || []);
      setTotalPaginas(res.totalPages || 1);
      setTotalElementos(res.totalElements || 0);
    } catch (err) {
      console.error('Erro ao carregar sensores:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarSensores();
  }, [pagina, regiaoFiltroId, apenasAtivos]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Cpu size={26} style={{ color: 'var(--secondary)' }} />
            Rede de Sensores IoT
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Dispositivos pluviométricos e fluviométricos instalados nas bacias monitoradas
          </p>
        </div>
      </div>

      {/* Painel de Filtros */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Filter size={16} />
            <strong>Filtrar por:</strong>
          </div>

          <div style={{ minWidth: '240px' }}>
            <select
              className="select"
              value={regiaoFiltroId}
              onChange={(e) => { setRegiaoFiltroId(e.target.value); setPagina(0); }}
            >
              <option value="">Todas as Regiões</option>
              {regioes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} ({r.cidade}/{r.estado})
                </option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={apenasAtivos}
              onChange={(e) => { setApenasAtivos(e.target.checked); setPagina(0); }}
            />
            Apenas sensores ativos
          </label>
        </div>
      </div>

      {/* Tabela de Sensores */}
      <div className="card">
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : sensores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p>Nenhum sensor encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Código Identificador</th>
                  <th>Tipo</th>
                  <th>Região Vinculada</th>
                  <th>Limiares de Risco</th>
                  <th>Última Telemetria</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sensores.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {s.codigoIdentificador}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {s.tipo === 'PLUVIOMETRO' ? '🌧️ Pluviômetro' : '🌊 Nível da Água'}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Unidade: {s.unidadeMedida}
                      </div>
                    </td>
                    <td>
                      <Link to={`/regioes/${s.regiaoId}`} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>
                        <MapPin size={13} style={{ display: 'inline', marginRight: '0.3rem', color: 'var(--primary)' }} />
                        {s.nomeRegiao}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', display: 'flex', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--risk-atencao)' }}>
                          Atenção: <strong>&ge; {s.limiteAtencao}</strong>
                        </span>
                        <span style={{ color: 'var(--risk-alerta)' }}>
                          Alerta: <strong>&ge; {s.limiteAlerta}</strong>
                        </span>
                        <span style={{ color: 'var(--risk-perigo)' }}>
                          Perigo: <strong>&ge; {s.limitePerigo}</strong>
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {s.ultimaLeitura ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} />
                          {new Date(s.ultimaLeitura).toLocaleString('pt-BR')}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Aguardando sinal</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: s.ativo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: s.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)'
                      }}>
                        {s.ativo ? 'Ativo' : 'Desativado'}
                      </span>
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
            <span>Mostrando página {pagina + 1} de {totalPaginas} ({totalElementos} sensores)</span>
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
