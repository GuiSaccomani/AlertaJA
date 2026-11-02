-- =============================================================================
-- ALERTAJÁ - SISTEMA DE MONITORAMENTO DE RISCOS DE ALAGAMENTO
-- SCRIPT DE CRIAÇÃO DO ESQUEMA, CONSTRAINTS E SEMENTES DE DADOS (POSTGRESQL)
-- =============================================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuario_role CHECK (role IN ('ROLE_ADMIN', 'ROLE_CIDADAO'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2. TABELA DE REGIÕES MONITORADAS (BACIAS / SETORES)
CREATE TABLE IF NOT EXISTS regioes (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    nivel_risco_atual VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP,
    CONSTRAINT chk_regiao_risco CHECK (nivel_risco_atual IN ('NORMAL', 'ATENCAO', 'ALERTA', 'PERIGO'))
);

CREATE INDEX IF NOT EXISTS idx_regioes_ativo ON regioes(ativo);
CREATE INDEX IF NOT EXISTS idx_regioes_risco ON regioes(nivel_risco_atual);

-- 3. TABELA DE SENSORES IoT
CREATE TABLE IF NOT EXISTS sensores (
    id BIGSERIAL PRIMARY KEY,
    regiao_id BIGINT NOT NULL,
    codigo_identificador VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    limite_atencao NUMERIC(10,2) NOT NULL,
    limite_alerta NUMERIC(10,2) NOT NULL,
    limite_perigo NUMERIC(10,2) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_leitura TIMESTAMP,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP,
    CONSTRAINT fk_sensores_regiao FOREIGN KEY (regiao_id) REFERENCES regioes(id) ON DELETE RESTRICT,
    CONSTRAINT chk_sensores_tipo CHECK (tipo IN ('PLUVIOMETRO', 'NIVEL_AGUA')),
    CONSTRAINT chk_sensores_limiares CHECK (limite_atencao < limite_alerta AND limite_alerta < limite_perigo)
);

CREATE INDEX IF NOT EXISTS idx_sensores_regiao_id ON sensores(regiao_id);
CREATE INDEX IF NOT EXISTS idx_sensores_codigo ON sensores(codigo_identificador);
CREATE INDEX IF NOT EXISTS idx_sensores_ativo ON sensores(ativo);

-- 4. TABELA DE MEDIÇÕES (TELEMETRIA HISTÓRICA)
CREATE TABLE IF NOT EXISTS medicoes (
    id BIGSERIAL PRIMARY KEY,
    sensor_id BIGINT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicoes_sensor FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE RESTRICT,
    CONSTRAINT chk_medicoes_valor_positivo CHECK (valor >= 0.00)
);

CREATE INDEX IF NOT EXISTS idx_medicoes_sensor_data ON medicoes(sensor_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_medicoes_data_hora ON medicoes(data_hora DESC);

-- 5. TABELA DE ALERTAS E INCIDENTES
CREATE TABLE IF NOT EXISTS alertas (
    id BIGSERIAL PRIMARY KEY,
    regiao_id BIGINT NOT NULL,
    sensor_id BIGINT NOT NULL,
    medicao_origem_id BIGINT NOT NULL,
    medicao_ultima_id BIGINT,
    nivel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_emissao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_ultima_ocorrencia TIMESTAMP,
    data_resolucao TIMESTAMP,
    CONSTRAINT fk_alertas_regiao FOREIGN KEY (regiao_id) REFERENCES regioes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_sensor FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_medicao_origem FOREIGN KEY (medicao_origem_id) REFERENCES medicoes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_alertas_medicao_ultima FOREIGN KEY (medicao_ultima_id) REFERENCES medicoes(id) ON DELETE RESTRICT,
    CONSTRAINT chk_alertas_nivel CHECK (nivel IN ('NORMAL', 'ATENCAO', 'ALERTA', 'PERIGO')),
    CONSTRAINT chk_alertas_status CHECK (status IN ('ATIVO', 'RESOLVIDO_AUTO', 'RESOLVIDO_MANUAL'))
);

CREATE INDEX IF NOT EXISTS idx_alertas_regiao_ativo ON alertas(regiao_id, ativo);
CREATE INDEX IF NOT EXISTS idx_alertas_sensor_ativo ON alertas(sensor_id, ativo);
CREATE INDEX IF NOT EXISTS idx_alertas_data_emissao ON alertas(data_emissao DESC);

-- =============================================================================
-- SEMENTES DE DADOS (SEEDS DEMONSTRATIVOS)
-- =============================================================================

-- Usuários: Senha criptografada com BCrypt (cost 12)
-- Admin: Admin@123456 | Cidadão: Cidadao@123456
INSERT INTO usuarios (nome, email, senha, role) VALUES
('Administrador do Sistema', 'admin@alertaja.com', '$2a$12$f0T1nZ18685pL63dE73jF.m8kXf2MlhgXq6W00hL0Y7lA3P0O3gfe', 'ROLE_ADMIN'),
('Carlos Cidadão Monitor', 'cidadao@alertaja.com', '$2a$12$4mU3Zk35619pB51dD82kG.n9lYe3NmigYr7X11iM1Z8mB4Q1P4hgf', 'ROLE_CIDADAO')
ON CONFLICT (email) DO NOTHING;

-- Regiões
INSERT INTO regioes (id, nome, cidade, estado, nivel_risco_atual, ativo) VALUES
(1, 'Bacia Hidrográfica do Rio Tietê - Setor Sul', 'São Paulo', 'SP', 'NORMAL', TRUE),
(2, 'Córrego do Ipiranga - Bacia Tamanduateí', 'São Paulo', 'SP', 'NORMAL', TRUE),
(3, 'Bacia do Rio Pinheiros - Setor Oeste', 'São Paulo', 'SP', 'NORMAL', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Sensores
INSERT INTO sensores (id, regiao_id, codigo_identificador, tipo, unidade_medida, limite_atencao, limite_alerta, limite_perigo, ativo) VALUES
(1, 1, 'PLUV-SUL-01', 'PLUVIOMETRO', 'mm/h', 20.00, 40.00, 60.00, TRUE),
(2, 1, 'NIVEL-RIO-01', 'NIVEL_AGUA', 'm', 2.50, 4.00, 5.50, TRUE),
(3, 2, 'PLUV-IPI-01', 'PLUVIOMETRO', 'mm/h', 25.00, 45.00, 65.00, TRUE),
(4, 3, 'NIVEL-PIN-01', 'NIVEL_AGUA', 'm', 2.80, 4.20, 5.80, TRUE)
ON CONFLICT (id) DO NOTHING;
