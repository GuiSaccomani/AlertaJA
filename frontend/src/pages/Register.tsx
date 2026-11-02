import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { animatePageEnter } from '../utils/motion';
import { UserPlus, AlertCircle, CheckCircle2, Shield, Layers } from 'lucide-react';

export const Register: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (containerRef.current) {
      animatePageEnter(containerRef.current);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro('A chave de acesso deve conter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmaSenha) {
      setErro('A confirmação da senha não confere.');
      return;
    }

    setCarregando(true);

    try {
      const data = await authService.cadastrar(nome.trim(), email.trim(), senha);
      setSucesso(true);
      login(data.token, data.usuario);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErro('Este endereço de e-mail já está cadastrado no sistema.');
      } else {
        setErro(err.response?.data?.message || 'Falha ao processar o cadastro de cidadão.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div ref={containerRef} style={{ maxWidth: '880px', margin: '2rem auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
        {/* Painel Esquerdo: Instruções ao Cidadão */}
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
                  CADASTRO DE CIDADÃO
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-pure)', marginBottom: '0.65rem' }}>
              Rede Comunitária de Alerta Antecipado
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Ao se cadastrar, você tem acesso às leituras em tempo real das bacias hidrográficas monitoradas, histórico de medições pluviométricas e central de incidentes.
            </p>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <Shield size={12} style={{ color: 'var(--risk-normal)' }} />
                <span>Perfil atribuído: Cidadão (ROLE_CIDADAO)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <Shield size={12} style={{ color: 'var(--cyan-telemetry)' }} />
                <span>Armazenamento criptografado com hash BCrypt</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Ambiente acadêmico para gestão preventiva de alagamentos urbanos.
          </div>
        </div>

        {/* Painel Direito: Formulário de Cadastro */}
        <div className="panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-telemetry)', letterSpacing: '0.06em' }}>
              USER.REGISTER // NOVO-REGISTRO
            </span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.2rem 0 0', color: 'var(--text-pure)' }}>
              Criar Conta de Acesso
            </h3>
          </div>

          {erro && (
            <div className="status-banner status-banner-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="status-banner status-banner-success" style={{ marginBottom: '1rem' }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>Cadastro concluído! Acessando o centro de controle...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="nome">Nome Completo</label>
              <input
                id="nome"
                type="text"
                className="form-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Ferreira"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos.ferreira@exemplo.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="senha">Senha (&ge; 6 car.)</label>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="confirmaSenha">Confirmar</label>
                <input
                  id="confirmaSenha"
                  type="password"
                  className="form-input"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem' }}
              disabled={carregando || sucesso}
            >
              {carregando ? (
                <div className="spinner-op" />
              ) : (
                <>
                  <UserPlus size={14} /> Concluir Cadastro
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Já possui credencial cadastrada?{' '}
            <Link to="/login" style={{ color: 'var(--cyan-telemetry)', textDecoration: 'none', fontWeight: 600 }}>
              Acessar plataforma
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
