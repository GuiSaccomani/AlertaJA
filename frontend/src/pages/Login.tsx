import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { LogIn, AlertCircle, Shield, User } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const data = await authService.login(email.trim(), senha);
      login(data.token, data.usuario);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErro('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        setErro(err.response?.data?.message || 'Falha ao autenticar no servidor. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const preencherDemo = (tipo: 'admin' | 'cidadao') => {
    if (tipo === 'admin') {
      setEmail('admin@alertaja.com');
      setSenha('Admin@123456');
    } else {
      setEmail('cidadao@alertaja.com');
      setSenha('Cidadao@123456');
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem' }}>
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Acesso ao Sistema</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Entre com suas credenciais para monitorar riscos
          </p>
        </div>

        {erro && (
          <div className="alert-box alert-box-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={carregando}
          >
            {carregando ? <div className="spinner spinner-sm" /> : <><LogIn size={18} /> Entrar na Plataforma</>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Contas de Demonstração Rápida:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => preencherDemo('admin')}
              className="btn btn-secondary btn-sm"
              title="Preenche credenciais do Administrador"
            >
              <Shield size={14} style={{ color: 'var(--risk-atencao)' }} />
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => preencherDemo('cidadao')}
              className="btn btn-secondary btn-sm"
              title="Preenche credenciais de Cidadão"
            >
              <User size={14} style={{ color: 'var(--secondary)' }} />
              Cidadão Demo
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Ainda não possui conta?{' '}
          <Link to="/cadastro" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Cadastre-se como cidadão
          </Link>
        </div>
      </div>
    </div>
  );
};
