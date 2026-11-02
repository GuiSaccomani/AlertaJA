# AlertaJá - Simulador de Sensores IoT

> **AVISO IMPORTANTE / AMBIENTE ACADÊMICO:**  
> Este simulador é parte integrante de um projeto acadêmico de engenharia de software e foi desenvolvido para testes e validação das regras de negócio do sistema **AlertaJá**.  
> Todos os valores e leituras meteorológicas/hidrológicas são **FICTÍCIOS**, gerados computacionalmente.  
> **NÃO** utilize este software como ferramenta oficial de previsão de desastres ou alerta da Defesa Civil.

---

## 1. Visão Geral

O simulador em Python gera leituras de telemetria coerentes e as envia para o backend real do **AlertaJá** através do endpoint protegido `POST /api/v1/medicoes`, utilizando o cabeçalho seguro de autenticação `X-Sensor-API-Key`.

O script modela o comportamento de dois tipos principais de sensores:
1. **Pluviômetro (`PLUVIOMETRO`)**: Mede a intensidade de precipitação pluviométrica em milímetros por hora (`mm/h`). Código padrão: `PLUV-SUL-01`.
2. **Sensor de Nível d'Água (`NIVEL_AGUA`)**: Mede a cota fluviométrica de rios e córregos em metros (`m`). Código padrão: `NIVEL-RIO-01`.

### Limiares de Risco Configurados

| Sensor | Tipo | Unidade | Atenção | Alerta | Perigo |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `PLUV-SUL-01` | `PLUVIOMETRO` | mm/h | $\ge 20.0$ | $\ge 40.0$ | $\ge 60.0$ |
| `NIVEL-RIO-01` | `NIVEL_AGUA` | m | $\ge 2.5$ | $\ge 4.0$ | $\ge 5.5$ |

---

## 2. Pré-requisitos

- **Python**: versão 3.10 ou superior (testado com Python 3.12).
- **Backend AlertaJá**: Spring Boot em execução (porta padrão `8080`).

---

## 3. Instalação e Configuração

### 3.1. Instalação das dependências

No terminal, a partir do diretório raiz do projeto ou da pasta `simulator/`:

```bash
pip install -r simulator/requirements.txt
```

### 3.2. Configuração do arquivo `.env`

Crie uma cópia do arquivo `.env.example` nomeada como `.env` dentro da pasta `simulator/`:

```bash
cp simulator/.env.example simulator/.env
```

Edite o arquivo `simulator/.env` com as configurações do seu ambiente:

```env
# URL base da API REST do AlertaJá
API_BASE_URL=http://localhost:8080

# Chave secreta de ingestão de sensores (deve bater com SENSOR_INGESTION_API_KEY do backend)
SENSOR_INGESTION_API_KEY=sua-chave-secreta-configurada-no-backend

# Intervalo entre envios na simulação contínua (segundos)
SIMULATION_INTERVAL_SECONDS=2.0

# Opcional: credenciais de administrador para bootstrap automático de regiões/sensores
ADMIN_EMAIL=admin@alertaja.com
ADMIN_PASSWORD=Admin@123456
```

> **Segurança:** O arquivo `.env` está explicitamente incluído no `.gitignore` e nunca deve ser commitado no repositório com dados reais.

---

## 4. Modos de Execução

### 4.1. Bootstrap Automático do Ambiente (Opcional)

Caso os sensores e regiões de teste ainda não existam no banco de dados, o script pode criá-los automaticamente via API administrativa passando a flag `--bootstrap`:

```bash
python simulator/simulate_sensors.py --bootstrap
```

### 4.2. Execução de Cenários de Teste Controlados

O simulador implementa cenários específicos para demonstrar cada regra de negócio do motor de alertas e da persistência:

| Flag | Cenário Demonstrado |
| :--- | :--- |
| `--scenario normal` | Medições abaixo do limite de atenção (Risco `NORMAL`, nenhum alerta). |
| `--scenario atencao` | Medição em `ATENCAO` e teste de **anti-duplicação** no mesmo nível de risco. |
| `--scenario alerta` | Escalonamento de risco de `ATENCAO` para `ALERTA` (encerra alerta anterior). |
| `--scenario perigo` | Escalonamento de risco para o nível máximo `PERIGO`. |
| `--scenario recuperacao` | Desescalonamento das chuvas e **auto-resolução** de alertas ao atingir `NORMAL`. |
| `--scenario multiplos` | Dois sensores na mesma região: preservação do risco regional em `ATENCAO` mesmo após a normalização do pluviômetro. |
| `--scenario all` | Executa a sequência didática completa de todos os 6 cenários acima. |

#### Exemplos de comandos:

```bash
# Executa apenas o cenário de normalidade
python simulator/simulate_sensors.py --scenario normal

# Executa o teste de anti-duplicação e atenção
python simulator/simulate_sensors.py --scenario atencao

# Executa a demonstração do recálculo regional com múltiplos sensores
python simulator/simulate_sensors.py --scenario multiplos

# Executa toda a bateria de testes de uma só vez
python simulator/simulate_sensors.py --scenario all
```

### 4.3. Simulação Contínua (Loop com Oscilação Climática)

Simula o ciclo meteorológico de uma tempestade real com aumento progressivo da precipitação e subida posterior da cota do rio, seguido de dispersão da chuva e vazante lenta das águas:

```bash
python simulator/simulate_sensors.py --continuous --interval 2.5
```

- Para interromper a qualquer momento de forma limpa, pressione `Ctrl + C`.

---

## 5. Auditoria de Segurança e Logs

- O script **mascara a chave de API** em todas as saídas no console (`X-Sensor-API-Key: [OCULTA / PROTEGIDA]`).
- Todo envio exibe o método HTTP, o código de resposta (ex: `201 CREATED`), o ID da medição persistida e o nível de risco calculado instantaneamente pelo backend.
- Trata erros de conexão (`ConnectionError`), indisponibilidade e timeouts de forma amigável sem interromper abruptamente o terminal.
