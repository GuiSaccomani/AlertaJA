export type RoleUsuario = 'ROLE_ADMIN' | 'ROLE_CIDADAO';

export type NivelRisco = 'NORMAL' | 'ATENCAO' | 'ALERTA' | 'PERIGO';

export type StatusAlerta = 'ATIVO' | 'RESOLVIDO_AUTO' | 'RESOLVIDO_MANUAL';

export type TipoSensor = 'PLUVIOMETRO' | 'NIVEL_AGUA';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: RoleUsuario;
  criadoEm?: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  usuario: Usuario;
}

export interface Regiao {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  nivelRiscoAtual: NivelRisco;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface RegiaoRequest {
  nome: string;
  cidade: string;
  estado: string;
}

export interface Sensor {
  id: number;
  regiaoId: number;
  nomeRegiao: string;
  codigoIdentificador: string;
  tipo: TipoSensor;
  unidadeMedida: string;
  limiteAtencao: number;
  limiteAlerta: number;
  limitePerigo: number;
  ativo: boolean;
  ultimaLeitura?: string;
  criadoEm: string;
}

export interface SensorRequest {
  regiaoId: number;
  codigoIdentificador: string;
  tipo: TipoSensor;
  unidadeMedida: string;
  limiteAtencao: number;
  limiteAlerta: number;
  limitePerigo: number;
}

export interface Medicao {
  id: number;
  sensorId: number;
  codigoSensor: string;
  tipoSensor: TipoSensor;
  regiaoId: number;
  nomeRegiao: string;
  valor: number;
  unidadeMedida: string;
  dataHora: string;
  nivelRiscoDetectado: NivelRisco;
  criadoEm: string;
}

export interface Alerta {
  id: number;
  regiaoId: number;
  nomeRegiao: string;
  sensorId: number;
  codigoSensor: string;
  tipoSensor: TipoSensor;
  medicaoOrigemId: number;
  medicaoUltimaId?: number;
  nivel: NivelRisco;
  status: StatusAlerta;
  titulo: string;
  descricao: string;
  ativo: boolean;
  dataEmissao: string;
  dataUltimaOcorrencia?: string;
  dataResolucao?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export interface ResumoDashboard {
  totalRegioes: number;
  totalSensoresAtivos: number;
  totalAlertasAtivos: number;
  nivelRiscoGlobal: NivelRisco;
}
