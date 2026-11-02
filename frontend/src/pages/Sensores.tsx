import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { sensorService, regiaoService } from '../services/api';
import { Sensor, Regiao } from '../types';
import { animatePageEnter } from '../utils/motion';
import {
  Cpu,
  MapPin,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Droplets,
  Waves
} from 'lucide-react';

export const Sensores: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [regiaoFiltroId, setRegiaoFiltroId] = useState<string>('');
  const [apenasAtivos, setApenasAtivos] = useState<boolean>(true);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (containerRef.current) {
      animatePageEnter(containerRef.current);
    }
  }, []);

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
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.08em' }}>
              IOT.NETWORK // ESTAÇÕES-TELEMÉTRICAS
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Inventário da Rede de Sensores IoT
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Estações pluviométricas e sensores de cota fluvial em monitoramento de campo
          </p>
        </div>

        <button onClick={carregarSensores} className="btn btn-secondary btn-sm" disabled={carregando}>
          <RefreshCw size={12} className={carregando ? 'spinner-op' : ''} />
          Atualizar Lista
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="panel" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Filter size={14} style={{ color: 'var(--cyan-telemetry)' }} />
            Filtrar Bacia:
          </div>

          <div style={{ minWidth: '260px' }}>
            <select
              className="form-select"
              style={{ width: '100%', padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
              value={regiaoFiltroId}
              onChange={(e) => { setRegiaoFiltroId(e.target.value); setPagina(0); }}
            >
              <option value="">Todas as Bacias Hidrográficas</option>
              {regioes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} ({r.cidade}/{r.estado})
                </option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
            <input
              type="checkbox"
              checked={apenasAtivos}
              onChange={(e) => { setApenasAtivos(e.target.checked); setPagina(0); }}
              style={{ accentColor: 'var(--cyan-telemetry)' }}
            />
            Ocultar sensores inativos
          </label>
        </div>
      </div>

      {/* Tabela de Sensores */}
      <div className="panel" style={{ padding: 0 }}>
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3.5rem', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
            <div className="spinner-op" />
            <span style={{ fontSize: '0.82rem' }}>Verificando integridade da rede IoT...</span>
          </div>
        ) : sensores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-tertiary)' }}>
            <Cpu size={36} style={{ color: 'var(--border-default)', margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Nenhum sensor encontrado</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Altere o filtro de bacia ou habilite a exibição de estações inativas.
            </p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="op-table">
              <thead>
                <tr>
                  <th>Código de Estação</th>
                  <th>Modalidade de Coleta</th>
                  <th>Bacia de Drenagem</th>
                  <th>Régua de Limiares (Atenção / Alerta / Perigo)</th>
                  <th>Última Transmissão</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sensores.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan-telemetry)' }}>
                        {s.codigoIdentificador}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 500, fontSize: '0.82rem', color: 'var(--text-pure)' }}>
                        {s.tipo === 'PLUVIOMETRO' ? <Droplets size={13} style={{ color: '#38bdf8' }} /> : <Waves size={13} style={{ color: '#06b6d4' }} />}
                        {s.tipo === 'PLUVIOMETRO' ? 'Pluviômetro' : 'Nível da Calha'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        Unidade: {s.unidadeMedida}
                      </div>
                    </td>
                    <td>
                      <Link to={`/regioes/${s.regiaoId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '0.3rem', color: 'var(--text-tertiary)' }} />
                        {s.nomeRegiao}
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.65rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--risk-atencao)' }}>
                          &ge; {s.limiteAtencao}
                        </span>
                        <span style={{ color: 'var(--text-dim)' }}>|</span>
                        <span style={{ color: 'var(--risk-alerta)' }}>
                          &ge; {s.limiteAlerta}
                        </span>
                        <span style={{ color: 'var(--text-dim)' }}>|</span>
                        <span style={{ color: 'var(--risk-perigo)', fontWeight: 700 }}>
                          &ge; {s.limitePerigo} {s.unidadeMedida}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {s.ultimaLeitura ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
                          {new Date(s.ultimaLeitura).toLocaleString('pt-BR')}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Aguardando sinal</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '2px',
                        background: s.ativo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: s.ativo ? 'var(--risk-normal)' : 'var(--risk-perigo)'
                      }}>
                        {s.ativo ? 'OPERACIONAL' : 'DESATIVADO'}
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
          <div className="pagination-bar">
            <span>
              Mostrando página {pagina + 1} de {totalPaginas} ({totalElementos} sensores)
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
