# AlertaJá - Arquitetura de Software e Engenharia do Sistema

O **AlertaJá** é uma plataforma distribuída desenvolvida para monitoramento contínuo de riscos hidrológicos e alagamentos urbanos, integrando telemetria em tempo real de sensores pluviométricos e fluviométricos, motor de regras de alerta automatizado e interface de comando e controle para cidadãos e equipes de resposta civil.

---

## 1. Diagrama de Arquitetura do Sistema

```mermaid
flowchart TB
    subgraph IoT_Edge["Borda & Simulação IoT (Python)"]
        PluvSensor["Sensor Pluviométrico (PLUV-SUL-01)<br/>Volume de Chuva (mm/h)"]
        NivelSensor["Sensor Fluviométrico (NIVEL-RIO-01)<br/>Cota do Rio (m)"]
        SimEngine["Simulador Climático Python<br/>(simulate_sensors.py)"]
        PluvSensor --> SimEngine
        NivelSensor --> SimEngine
    end

    subgraph Security_Boundary["Barreira de Segurança & Ingestão"]
        ApiKeyAuth["Filtro X-Sensor-API-Key<br/>ROLE_SENSOR_INGESTION"]
        JwtAuth["Filtro JWT Bearer<br/>ROLE_ADMIN / ROLE_CIDADAO"]
    end

    subgraph Backend_App["Backend AlertaJá (Java 21 / Spring Boot 3.4)"]
        RestController["Controllers REST (/api/v1)"]
        
        subgraph Business_Services["Camada de Serviços & Motor de Alertas"]
            MedicaoService["MedicaoService<br/>(@Transactional Ingestão)"]
            MotorAlertas["MotorAlertasService<br/>- Anti-duplicação<br/>- Escalonamento<br/>- Auto-resolução"]
            RegiaoService["RegiaoService<br/>(Recálculo de Risco Regional)"]
            SensorService["SensorService<br/>(Validação Limiares)"]
            AuthService["AuthService<br/>(BCrypt / Token JWT)"]
        end
        
        subgraph Persistence_Layer["Spring Data JPA & Repositórios"]
            RepoMedicao["MedicaoRepository"]
            RepoAlerta["AlertaRepository"]
            RepoSensor["SensorRepository"]
            RepoRegiao["RegiaoRepository"]
            RepoUsuario["UsuarioRepository"]
        end
    end

    subgraph Database["Armazenamento Persistente"]
        PostgresDB[("PostgreSQL / H2 modo PostgreSQL<br/>- Migrações Flyway V1<br/>- Integridade Referencial")]
    end

    subgraph Frontend_App["Interface Web de Comando (React / TypeScript)"]
        DashboardUI["Dashboard com Polling (10s)"]
        RegioesUI["Gestão de Regiões & Bacias"]
        AlertasUI["Central de Alertas & Resolução"]
        AdminUI["Painel Administrativo (RBAC)"]
    end

    %% Conexões
    SimEngine -->|"POST /api/v1/medicoes (X-Sensor-API-Key)"| ApiKeyAuth
    ApiKeyAuth --> RestController
    
    Frontend_App -->|"HTTP REST + JWT Bearer"| JwtAuth
    JwtAuth --> RestController

    RestController --> Business_Services
    MedicaoService --> MotorAlertas
    MotorAlertas --> RegiaoService
    Business_Services --> Persistence_Layer
    Persistence_Layer --> PostgresDB
```

---

## 2. Fluxo de Vida de uma Medição e do Motor de Alertas

```mermaid
sequenceDiagram
    autonumber
    actor Sensor as Simulador IoT
    participant API as MedicaoController
    participant Svc as MedicaoService (@Transactional)
    participant Motor as MotorAlertasService
    participant RegiaoSvc as RegiaoService
    participant DB as PostgreSQL

    Sensor->>API: POST /api/v1/medicoes (X-Sensor-API-Key)
    API->>Svc: registrarMedicao(request)
    Svc->>DB: Verifica integridade (Sensor ativo? Região ativa?)
    Svc->>DB: INSERT INTO medicoes (...)
    Svc->>DB: UPDATE sensores SET ultima_leitura = NOW()
    
    Svc->>Motor: processarAlertaEMedicao(sensor, medicaoSalva)
    alt Valor >= Limiar de Risco (Atenção, Alerta ou Perigo)
        alt Sensor já tem Alerta ATIVO no mesmo nível
            Motor->>DB: UPDATE alertas SET data_ultima_ocorrencia = NOW(), medicao_ultima_id = medicaoId (ANTI-DUPLICAÇÃO)
        else Sensor estava em nível diferente (Escalonamento)
            Motor->>DB: UPDATE alertas SET status = 'RESOLVIDO_AUTO', ativo = false (Encerra nível anterior)
            Motor->>DB: INSERT INTO alertas (nivel = novoNivel, status = 'ATIVO')
        end
    else Valor abaixo de Atenção (NORMAL)
        alt Sensor possui alerta ATIVO
            Motor->>DB: UPDATE alertas SET status = 'RESOLVIDO_AUTO', ativo = false, data_resolucao = NOW() (AUTO-RESOLUÇÃO)
        end
    end
    
    Motor->>RegiaoSvc: recalcularRiscoRegiao(regiaoId)
    RegiaoSvc->>DB: Consulta todos os sensores ativos da região
    Note over RegiaoSvc: Calcula o maior risco entre os sensores ativos.<br/>A região NÃO normaliza se outro sensor estiver em risco!
    RegiaoSvc->>DB: UPDATE regioes SET nivel_risco_atual = maiorRisco
    
    Svc-->>API: MedicaoResponse (com nível detectado)
    API-->>Sensor: HTTP 201 CREATED
```

---

## 3. Pilares Arquiteturais

1. **Separação de Papéis e Credenciais (Zero Trust Telemetria):**
   * Dispositivos de telemetria não utilizam credenciais de usuários (JWT), mas sim a chave de cabeçalho `X-Sensor-API-Key`.
   * Cidadãos autenticados não possuem autorização de telemetria (`ROLE_SENSOR_INGESTION`), impedindo injeção forjada de dados meteorológicos.
   * Administradores (`ROLE_ADMIN`) são os únicos com autoridade para cadastrar, editar, desativar regiões/sensores e resolver alertas manualmente.

2. **Consistência Transacional Estrita (`@Transactional`):**
   * A persistência da medição, o acionamento do motor de alertas e o recálculo do risco regional são executados sob o mesmo contexto transacional. Qualquer erro imprevisto aciona o rollback imediato no banco, impedindo inconsistência no estado dos dados.

3. **Exclusão Lógica e Rastreabilidade (*Soft Delete*):**
   * Regiões e sensores possuem a flag `ativo = true/false`. Desativações preservam o histórico de medições anteriores para fins periciais e estatísticos.
   * Cada alerta armazena a `medicao_origem_id` (leitura que abriu a crise) e `medicao_ultima_id` (leitura mais recente em caso de reincidência contínua).
