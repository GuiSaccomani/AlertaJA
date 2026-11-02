import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  MapPin,
  Cpu,
  AlertTriangle,
  Shield,
  LogOut,
  User,
  LogIn,
  UserPlus
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { usuario, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="ccom-navbar">
      <div className="ccom-nav-container">
        <NavLink to="/dashboard" className="ccom-brand" title="Centro de Operações AlertaJá">
          <div className="ccom-brand-radar">
            <Layers size={16} />
          </div>
          <div>
            <div className="ccom-brand-title">
              ALERTA<span>JÁ</span>
            </div>
            <div className="ccom-brand-sub">OPERAÇÕES HIDROLÓGICAS</div>
          </div>
        </NavLink>

        <nav aria-label="Navegação Principal">
          <ul className="ccom-nav-links">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => `ccom-nav-item ${isActive ? 'active' : ''}`}>
                <Layers size={14} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/regioes" className={({ isActive }) => `ccom-nav-item ${isActive ? 'active' : ''}`}>
                <MapPin size={14} />
                Regiões
              </NavLink>
            </li>
            <li>
              <NavLink to="/alertas" className={({ isActive }) => `ccom-nav-item ${isActive ? 'active' : ''}`}>
                <AlertTriangle size={14} />
                Central de Alertas
              </NavLink>
            </li>
            <li>
              <NavLink to="/sensores" className={({ isActive }) => `ccom-nav-item ${isActive ? 'active' : ''}`}>
                <Cpu size={14} />
                Sensores IoT
              </NavLink>
            </li>
            {isAdmin && (
              <li>
                <NavLink to="/admin" className={({ isActive }) => `ccom-nav-item ${isActive ? 'active' : ''}`}>
                  <Shield size={14} />
                  Administração
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="ccom-user-panel">
          {isAuthenticated && usuario ? (
            <>
              <div className="ccom-user-status">
                <User size={13} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontWeight: 500 }}>{usuario.nome.split(' ')[0]}</span>
                <span className={`ccom-role-badge ${isAdmin ? 'ccom-role-admin' : 'ccom-role-cidadao'}`}>
                  {isAdmin ? 'ADMIN' : 'CIDADÃO'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Encerrar Sessão Segura"
              >
                <LogOut size={13} />
                Sair
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <NavLink to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={13} />
                Entrar
              </NavLink>
              <NavLink to="/cadastro" className="btn btn-primary btn-sm">
                <UserPlus size={13} />
                Cadastro
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
