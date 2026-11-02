import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('alertaja_token'));
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    const carregarUsuario = async () => {
      const savedToken = localStorage.getItem('alertaja_token');
      if (!savedToken) {
        setCarregando(false);
        return;
      }

      try {
        const dadosUsuario = await authService.obterMe();
        setUsuario(dadosUsuario);
        setToken(savedToken);
      } catch (err) {
        console.warn('Sessão expirada ou token inválido');
        localStorage.removeItem('alertaja_token');
        setUsuario(null);
        setToken(null);
      } finally {
        setCarregando(false);
      }
    };

    carregarUsuario();
  }, []);

  const login = (novoToken: string, novoUsuario: Usuario) => {
    localStorage.setItem('alertaja_token', novoToken);
    setToken(novoToken);
    setUsuario(novoUsuario);
  };

  const logout = () => {
    localStorage.removeItem('alertaja_token');
    setToken(null);
    setUsuario(null);
  };

  const isAuthenticated = !!token && !!usuario;
  const isAdmin = usuario?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        carregando,
        isAuthenticated,
        isAdmin,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
