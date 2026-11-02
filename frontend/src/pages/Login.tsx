import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { animatePageEnter } from '../utils/motion';
import { LogIn, AlertCircle, Shield, User, Key, Radio, Layers } from 'lucide-react';

export const Login: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (containerRef.current) {
      animatePageEnter(containerRef.current);
    }
  }, []);

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
        setErro('Credenciais inválidas. Verifique o e-mail e a chave de acesso.');
      } else {
        setErro(err.response?.data?.message || 'Falha ao conectar com o serviço de autenticação.');
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
    <div ref={containerRef} style={{ maxWidth: '880px', margin: '2rem auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
        {/* Painel Esquerdo: Contexto Operacional */}
        <div
          className="panel"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #0c1424 0%, #080d18 100%)',
            borderRight: '1px solid var(--border-default)'
          }}
        >
          <div className="crosshair-corner crosshair-tl" />
          <div className="crosshair-corner crosshair-br" />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <div className="ccom-brand-radar" style={{ width: '32px', height: '32px' }}>
                <Layers size={18} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
                  ALERTA<span style={{ color: 'var(--cyan-telemetry)' }}>JÁ</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  PORTAL DE ACESSO OPERACIONAL
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-pure)', marginBottom: '0.65rem' }}>
              Vigilância Hidrológica e Gestão de Riscos Urbanos
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Acesso autenticado ao sistema de alerta antecipado contra inundações, telemetria contínua de sensores pluviométricos e cota de calhas fluviais.
            </p>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <Radio size={12} style={{ color: 'var(--risk-normal)' }} />
                <span>Malha de telemetria conectada e ativa</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <Shield size={12} style={{ color: 'var(--cyan-telemetry)' }} />
                <span>Autenticação criptográfica com JWT stateless</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.5rem' }}>
              Credenciais Rápidas de Avaliação:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => preencherDemo('admin')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.72rem' }}
                title="Preencher com credenciais de Administrador"
              >
                <Shield size={12} style={{ color: 'var(--risk-atencao)' }} />
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => preencherDemo('cidadao')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.72rem' }}
                title="Preencher com credenciais de Cidadão"
              >
                <User size={12} style={{ color: 'var(--cyan-telemetry)' }} />
                Cidadão Demo
              </button>
            </div>
          </div>
        </div>

        {/* Painel Direito: Formulário de Autenticação */}
        <div className="panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.06em' }}>
              AUTH://CREDENCIAL.OPERADOR
            </span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.2rem 0 0', color: 'var(--text-pure)' }}>
              Identificação de Usuário
            </h3>
          </div>

          {erro && (
            <div className="status-banner status-banner-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail Cadastrado</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@alertaja.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="senha">Chave Secreta de Acesso</label>
              <input
                id="senha"
                type="password"
                className="form-input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem' }}
              disabled={carregando}
            >
              {carregando ? (
                <div className="spinner-op" />
              ) : (
                <>
                  <LogIn size={14} /> Autenticar e Entrar
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Não possui credencial?{' '}
            <Link to="/cadastro" style={{ color: 'var(--cyan-telemetry)', textDecoration: 'none', fontWeight: 600 }}>
              Registrar como cidadão
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
