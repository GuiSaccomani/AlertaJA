import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isAdmin, carregando } = useAuth();

  if (carregando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: 'var(--risk-atencao)', margin: '0 auto 1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Autenticação Obrigatória</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Você precisa estar conectado como administrador para acessar o painel de gestão.
        </p>
        <Link to="/login" className="btn btn-primary">Fazer Login</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card" style={{ maxWidth: '550px', margin: '4rem auto', textAlign: 'center' }}>
        <ShieldAlert size={52} style={{ color: 'var(--risk-perigo)', margin: '0 auto 1rem' }} />
        <h2 style={{ marginBottom: '0.5rem', color: '#ffffff' }}>Acesso Restrito a Administradores</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Sua conta atual possui o papel de <strong>Cidadão</strong> (ROLE_CIDADAO). Operações de cadastro e desativação de regiões e sensores exigem credenciais administrativas (ROLE_ADMIN).
        </p>
        <Link to="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} /> Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  return children;
};
