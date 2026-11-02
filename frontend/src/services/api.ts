import axios, { AxiosError } from 'axios';
import {
  AuthResponse,
  Usuario,
  Regiao,
  RegiaoRequest,
  Sensor,
  SensorRequest,
  Medicao,
  Alerta,
  PageResponse,
  NivelRisco,
  StatusAlerta
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor de Requisição: Anexa Token JWT se presente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alertaja_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor de Resposta: Trata 401 e 403
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/cadastro') {
        localStorage.removeItem('alertaja_token');
        localStorage.removeItem('alertaja_user');
        window.location.href = '/login?expirado=true';
      }
    }
    return Promise.reject(error);
  }
);

// ==============================================================================
// SERVIÇOS DE AUTENTICAÇÃO
// ==============================================================================
export const authService = {
  login: async (email: string, senha: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/api/v1/auth/login', { email, senha });
    return res.data;
  },

  cadastrar: async (nome: string, email: string, senha: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/api/v1/auth/register', { nome, email, senha });
    return res.data;
  },

  obterMe: async (): Promise<Usuario> => {
    const res = await api.get<Usuario>('/api/v1/auth/me');
    return res.data;
  }
};

// ==============================================================================
// SERVIÇOS DE REGIÕES
// ==============================================================================
export const regiaoService = {
  listar: async (params?: { nome?: string; ativo?: boolean; page?: number; size?: number; sort?: string }): Promise<PageResponse<Regiao>> => {
    const res = await api.get<PageResponse<Regiao>>('/api/v1/regioes', { params });
    return res.data;
  },

  obterPorId: async (id: number): Promise<Regiao> => {
    const res = await api.get<Regiao>(`/api/v1/regioes/${id}`);
    return res.data;
  },

  criar: async (dados: RegiaoRequest): Promise<Regiao> => {
    const res = await api.post<Regiao>('/api/v1/regioes', dados);
    return res.data;
  },

  atualizar: async (id: number, dados: RegiaoRequest): Promise<Regiao> => {
    const res = await api.put<Regiao>(`/api/v1/regioes/${id}`, dados);
    return res.data;
  },

  desativar: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/regioes/${id}`);
  },

  reativar: async (id: number): Promise<Regiao> => {
    const res = await api.patch<Regiao>(`/api/v1/regioes/${id}/reativar`);
    return res.data;
  }
};

// ==============================================================================
// SERVIÇOS DE SENSORES
// ==============================================================================
export const sensorService = {
  listar: async (params?: { regiaoId?: number; ativo?: boolean; page?: number; size?: number; sort?: string }): Promise<PageResponse<Sensor>> => {
    const res = await api.get<PageResponse<Sensor>>('/api/v1/sensores', { params });
    return res.data;
  },

  obterPorId: async (id: number): Promise<Sensor> => {
    const res = await api.get<Sensor>(`/api/v1/sensores/${id}`);
    return res.data;
  },

  criar: async (dados: SensorRequest): Promise<Sensor> => {
    const res = await api.post<Sensor>('/api/v1/sensores', dados);
    return res.data;
  },

  atualizar: async (id: number, dados: SensorRequest): Promise<Sensor> => {
    const res = await api.put<Sensor>(`/api/v1/sensores/${id}`, dados);
    return res.data;
  },

  desativar: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/sensores/${id}`);
  },

  reativar: async (id: number): Promise<Sensor> => {
    const res = await api.patch<Sensor>(`/api/v1/sensores/${id}/reativar`);
    return res.data;
  }
};

// ==============================================================================
// SERVIÇOS DE MEDIÇÕES (TELEMETRIA)
// ==============================================================================
export const medicaoService = {
  listar: async (params?: {
    sensorId?: number;
    regiaoId?: number;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<Medicao>> => {
    const res = await api.get<PageResponse<Medicao>>('/api/v1/medicoes', { params });
    return res.data;
  }
};

// ==============================================================================
// SERVIÇOS DE ALERTAS
// ==============================================================================
export const alertaService = {
  listar: async (params?: {
    regiaoId?: number;
    sensorId?: number;
    nivel?: NivelRisco;
    status?: StatusAlerta;
    ativo?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<Alerta>> => {
    const res = await api.get<PageResponse<Alerta>>('/api/v1/alertas', { params });
    return res.data;
  },

  resolverManualmente: async (id: number): Promise<Alerta> => {
    const res = await api.patch<Alerta>(`/api/v1/alertas/${id}/resolver`);
    return res.data;
  }
};
