import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { regiaoService, sensorService, medicaoService } from '../services/api';
import { Regiao, Sensor, Medicao } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  MapPin,
  Cpu,
  Activity,
  ArrowLeft,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const RegiaoDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const regiaoId = Number(id);

  const [regiao, setRegiao] = useState<Regiao | null>(null);
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [paginaMedicoes, setPaginaMedicoes] = useState(0);
  const [totalPaginasMedicoes, setTotalPaginasMedicoes] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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
        setErro('Não foi possível carregar os dados desta região.');
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (erro || !regiao) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertCircle size={42} style={{ color: 'var(--risk-perigo)', margin: '0 auto 1rem' }} />
        <h2>Região Não Encontrada</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{erro || 'A região solicitada não existe ou foi removida.'}</p>
        <Link to="/regioes" className="btn btn-primary"><ArrowLeft size={16} /> Voltar para Regiões</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Botão de retorno e Cabeçalho */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/regioes" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
          <ArrowLeft size={14} /> Voltar para Lista de Regiões
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <MapPin size={28} style={{ color: 'var(--primary)' }} />
              {regiao.nome}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Localização: {regiao.cidade} - {regiao.estado} • Status: {regiao.ativo ? 'Operante' : 'Inativa'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem' }}>
              Risco Regional Atual
            </span>
            <RiskBadge nivel={regiao.nivelRiscoAtual} />
          </div>
        </div>
      </div>

      {/* Grid: Sensores Vinculados */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <Cpu size={20} style={{ color: 'var(--primary)' }} />
            Sensores Vinculados à Região ({sensores.length})
          </h2>
        </div>

        {sensores.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Nenhum sensor vinculado a esta região no momento.
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo de Sensor</th>
                  <th>Unidade</th>
                  <th>Limite Atenção</th>
                  <th>Limite Alerta</th>
                  <th>Limite Perigo</th>
                  <th>Última Leitura</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sensores.map((s) => (
                  <tr key={s.id}>
                    <td><code style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.codigoIdentificador}</code></td>
                    <td>{s.tipo === 'PLUVIOMETRO' ? 'Pluviômetro (Chuva)' : 'Nível d’Água (Rio)'}</td>
                    <td>{s.unidadeMedida}</td>
                    <td>{s.limiteAtencao} {s.unidadeMedida}</td>
                    <td>{s.limiteAlerta} {s.unidadeMedida}</td>
                    <td><strong style={{ color: 'var(--risk-perigo)' }}>{s.limitePerigo} {s.unidadeMedida}</strong></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {s.ultimaLeitura ? new Date(s.ultimaLeitura).toLocaleString('pt-BR') : 'Aguardando telemetria'}
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
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico de Medições Recebidas nesta Região */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Activity size={20} style={{ color: 'var(--secondary)' }} />
            Histórico de Telemetria da Região
          </h2>
        </div>

        {medicoes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            Nenhuma medição registrada para esta região ainda.
          </p>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sensor</th>
                    <th>Tipo</th>
                    <th>Valor Medido</th>
                    <th>Risco Avaliado</th>
                    <th>Data e Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {medicoes.map((m) => (
                    <tr key={m.id}>
                      <td><code>{m.codigoSensor}</code></td>
                      <td>{m.tipoSensor}</td>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        {m.valor} {m.unidadeMedida}
                      </td>
                      <td><RiskBadge nivel={m.nivelRiscoDetectado} /></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(m.dataHora).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginasMedicoes > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Página {paginaMedicoes + 1} de {totalPaginasMedicoes}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPaginaMedicoes((p) => Math.max(0, p - 1))}
                    disabled={paginaMedicoes === 0}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPaginaMedicoes((p) => Math.min(totalPaginasMedicoes - 1, p + 1))}
                    disabled={paginaMedicoes >= totalPaginasMedicoes - 1}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
