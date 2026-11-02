import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmaSenha) {
      setErro('As senhas digitadas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      const data = await authService.cadastrar(nome.trim(), email.trim(), senha);
      setSucesso(true);
      login(data.token, data.usuario);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErro('Este e-mail já está em uso por outro usuário.');
      } else {
        setErro(err.response?.data?.message || 'Falha ao realizar cadastro. Verifique os dados.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '3rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem' }}>
            <UserPlus size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Cadastro de Cidadão</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Crie sua conta para acompanhar os alertas da sua região
          </p>
        </div>

        {erro && (
          <div className="alert-box alert-box-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="alert-box alert-box-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>Cadastro realizado com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos.silva@exemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha (mínimo 6 caracteres)</label>
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirmaSenha">Confirmar Senha</label>
            <input
              id="confirmaSenha"
              type="password"
              className="input"
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={carregando || sucesso}
          >
            {carregando ? <div className="spinner spinner-sm" /> : <><UserPlus size={18} /> Criar Conta de Cidadão</>}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Já possui conta cadastrada?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Acessar o sistema
          </Link>
        </div>
      </div>
    </div>
  );
};
