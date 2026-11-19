-- =============================================================================
-- ALERTAJÁ
-- =============================================================================

CREATE TABLE usuarios (
    id          VARCHAR2(36) PRIMARY KEY,
    nome        VARCHAR2(100) NOT NULL,
    email       VARCHAR2(150) NOT NULL,
    senha       VARCHAR2(255) NOT NULL,
    role        VARCHAR2(20) NOT NULL,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_usuarios_email UNIQUE (email),
    CONSTRAINT chk_usuario_role CHECK (role IN ('ROLE_ADMIN', 'ROLE_CIDADAO'))
);

CREATE TABLE regioes (
    id                  VARCHAR2(36) PRIMARY KEY,
    nome                VARCHAR2(100) NOT NULL,
    cidade              VARCHAR2(100) NOT NULL,
    estado              VARCHAR2(2) NOT NULL,
    nivel_risco_atual   VARCHAR2(20) DEFAULT 'NORMAL' NOT NULL,
    ativo               NUMBER(1) DEFAULT 1 NOT NULL,
    criado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em       TIMESTAMP,
    CONSTRAINT chk_regiao_risco CHECK (nivel_risco_atual IN ('NORMAL', 'ATENCAO', 'ALERTA', 'PERIGO')),
    CONSTRAINT chk_regiao_ativo CHECK (ativo IN (0, 1))
);

CREATE TABLE sensores (
    id                      VARCHAR2(36) PRIMARY KEY,
    regiao_id               VARCHAR2(36) NOT NULL,
    codigo_identificador    VARCHAR2(50) NOT NULL,
    tipo                    VARCHAR2(20) NOT NULL,
    unidade_medida          VARCHAR2(20) NOT NULL,
    limite_atencao          NUMBER(10,2) NOT NULL,
    limite_alerta           NUMBER(10,2) NOT NULL,
    limite_perigo           NUMBER(10,2) NOT NULL,
    ativo                   NUMBER(1) DEFAULT 1 NOT NULL,
    ultima_leitura          TIMESTAMP,
    criado_em               TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em           TIMESTAMP,
    CONSTRAINT uk_sensores_codigo UNIQUE (codigo_identificador),
    CONSTRAINT fk_sensores_regiao FOREIGN KEY (regiao_id) REFERENCES regioes(id),
    CONSTRAINT chk_sensores_tipo CHECK (tipo IN ('PLUVIOMETRO', 'NIVEL_AGUA')),
    CONSTRAINT chk_sensores_limiares CHECK (limite_atencao < limite_alerta AND limite_alerta < limite_perigo),
    CONSTRAINT chk_sensores_ativo CHECK (ativo IN (0, 1))
);

CREATE TABLE medicoes (
    id          VARCHAR2(36) PRIMARY KEY,
    sensor_id   VARCHAR2(36) NOT NULL,
    valor       NUMBER(10,2) NOT NULL,
    data_hora   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_medicoes_sensor FOREIGN KEY (sensor_id) REFERENCES sensores(id),
    CONSTRAINT chk_medicoes_valor_positivo CHECK (valor >= 0)
);

CREATE TABLE alertas (
    id                      VARCHAR2(36) PRIMARY KEY,
    regiao_id               VARCHAR2(36) NOT NULL,
    sensor_id               VARCHAR2(36) NOT NULL,
    medicao_origem_id       VARCHAR2(36) NOT NULL,
    medicao_ultima_id       VARCHAR2(36),
    nivel                   VARCHAR2(20) NOT NULL,
    status                  VARCHAR2(20) DEFAULT 'ATIVO' NOT NULL,
    titulo                  VARCHAR2(150) NOT NULL,
    descricao               CLOB,
    ativo                   NUMBER(1) DEFAULT 1 NOT NULL,
    data_emissao            TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_ultima_ocorrencia  TIMESTAMP,
    data_resolucao          TIMESTAMP,
    CONSTRAINT fk_alertas_regiao FOREIGN KEY (regiao_id) REFERENCES regioes(id),
    CONSTRAINT fk_alertas_sensor FOREIGN KEY (sensor_id) REFERENCES sensores(id),
    CONSTRAINT fk_alertas_medicao_origem FOREIGN KEY (medicao_origem_id) REFERENCES medicoes(id),
    CONSTRAINT fk_alertas_medicao_ultima FOREIGN KEY (medicao_ultima_id) REFERENCES medicoes(id),
    CONSTRAINT chk_alertas_nivel CHECK (nivel IN ('NORMAL', 'ATENCAO', 'ALERTA', 'PERIGO')),
    CONSTRAINT chk_alertas_status CHECK (status IN ('ATIVO', 'RESOLVIDO_AUTO', 'RESOLVIDO_MANUAL')),
    CONSTRAINT chk_alertas_ativo CHECK (ativo IN (0, 1))
);

-- Índices básicos (suficientes para o MVP)

CREATE INDEX idx_regioes_ativo ON regioes(ativo);
CREATE INDEX idx_sensores_regiao ON sensores(regiao_id);
CREATE INDEX idx_medicoes_sensor_data ON medicoes(sensor_id, data_hora DESC);
CREATE INDEX idx_alertas_regiao_ativo ON alertas(regiao_id, ativo);
CREATE INDEX idx_alertas_status ON alertas(status);

COMMIT;