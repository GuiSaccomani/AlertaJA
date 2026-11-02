import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isAdmin, carregando } = useAuth();

  if (carregando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
        <div className="spinner-op" />
        <span style={{ fontSize: '0.82rem' }}>Validando autorização de segurança...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="panel" style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <ShieldAlert size={40} style={{ color: 'var(--risk-atencao)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-pure)' }}>Autenticação Requerida</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.82rem', lineHeight: 1.6 }}>
          Este console exige conexão autenticada com privilégios administrativos para intervenções na infraestrutura telemétrica.
        </p>
        <Link to="/login" className="btn btn-primary btn-sm">
          Acessar Terminal de Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="panel" style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center', padding: '2.5rem 2rem', borderLeft: '4px solid var(--risk-perigo)' }}>
        <ShieldAlert size={44} style={{ color: 'var(--risk-perigo)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-pure)' }}>Acesso Restrito a Administradores</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.82rem', lineHeight: 1.6 }}>
          Sua credencial atual possui perfil de <strong>Cidadão</strong> (ROLE_CIDADAO). Operações de cadastro, calibração e exclusão de estações telemétricas exigem nível de <strong>Administrador</strong> (ROLE_ADMIN).
        </p>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">
          <ArrowLeft size={13} /> Retornar ao Painel Hidrológico
        </Link>
      </div>
    );
  }

  return children;
};
