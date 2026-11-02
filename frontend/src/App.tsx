import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Navbar } from './components/Navbar';
import { AdminRoute } from './components/AdminRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Regioes } from './pages/Regioes';
import { RegiaoDetalhes } from './pages/RegiaoDetalhes';
import { Alertas } from './pages/Alertas';
import { Sensores } from './pages/Sensores';
import { Admin } from './pages/Admin';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          {/* Banner de Aviso Acadêmico / Simulação Obrigatório */}
          <DisclaimerBanner />

          {/* Barra Superior de Navegação */}
          <Navbar />

          {/* Conteúdo Principal com Rotas */}
          <main className="ccom-main-container">
            <Routes>
              {/* Rota Raiz Redireciona para o Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Rotas de Autenticação */}
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />

              {/* Telas Principais da Aplicação */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/regioes" element={<Regioes />} />
              <Route path="/regioes/:id" element={<RegiaoDetalhes />} />
              <Route path="/alertas" element={<Alertas />} />
              <Route path="/sensores" element={<Sensores />} />

              {/* Tela Exclusiva de Administração */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />

              {/* Fallback para rotas inexistentes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
