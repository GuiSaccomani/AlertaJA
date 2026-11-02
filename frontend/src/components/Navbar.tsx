import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  MapPin,
  Cpu,
  AlertOctagon,
  ShieldCheck,
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
    <header className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="brand-logo">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <span>Alerta<span className="brand-highlight">Já</span></span>
        </NavLink>

        <nav>
          <ul className="nav-links">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Activity size={16} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/regioes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <MapPin size={16} />
                Regiões
              </NavLink>
            </li>
            <li>
              <NavLink to="/alertas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <AlertOctagon size={16} />
                Central de Alertas
              </NavLink>
            </li>
            <li>
              <NavLink to="/sensores" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Cpu size={16} />
                Sensores
              </NavLink>
            </li>
            {isAdmin && (
              <li>
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ShieldCheck size={16} />
                  Administração
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="nav-user-section">
          {isAuthenticated && usuario ? (
            <>
              <div className="user-badge">
                <User size={15} style={{ color: 'var(--text-muted)' }} />
                <span>{usuario.nome.split(' ')[0]}</span>
                <span className={`user-role-tag ${isAdmin ? 'role-admin' : 'role-cidadao'}`}>
                  {isAdmin ? 'Admin' : 'Cidadão'}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Encerrar Sessão">
                <LogOut size={15} />
                Sair
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <NavLink to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                Entrar
              </NavLink>
              <NavLink to="/cadastro" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                Criar Conta
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
