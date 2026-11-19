# 🚨 Documentação da API e Evidências — AlertaJá

API desenvolvida em **C# com ASP.NET Core 10** para monitorar chuvas e níveis de rios por sensores IoT, gerar alertas automáticos e manter o risco de cada região atualizado. Persistência em **Oracle 19c** (servidor FIAP) com Entity Framework Core.

Arquitetura em camadas (**Controller → Service → AppDbContext/Repository**) com **segurança integrada**: senhas em hash, JWT, perfis de acesso, API Key para os sensores e HTTPS.

---

## 🚀 Configuração

* **URL base:** `https://localhost:7275`
* **Formato:** `JSON`
* **Autenticação de usuários:** `Authorization: Bearer <JWT>`
* **Autenticação dos sensores IoT:** `X-API-Key: <ALERTAJA_API_KEY>`

---

## 🛡️ Mecanismos de Segurança

* **Hash de senha:** `PasswordHasher` do ASP.NET Core Identity (PBKDF2-HMAC-SHA512, 100.000 iterações, salt aleatório). Nenhuma senha em texto puro.
* **JWT assinado (HS256):** emissor, audiência, assinatura e expiração validados — token adulterado é rejeitado (CT45 → 401).
* **Perfis de acesso:** `ROLE_ADMIN` (Defesa Civil) e `ROLE_CIDADAO`. Cadastro/edição/exclusão exigem admin (CT12, CT20, CT44 → 403).
* **API Key dos sensores:** comparação em tempo constante (`CryptographicOperations.FixedTimeEquals`) — CT26/CT27 → 401.
* **SQL Injection:** consultas parametrizadas pelo EF Core — o payload `' OR '1'='1' --` não autentica (CT06 → 401).
* **XSS:** respostas apenas em JSON; o React escapa todo conteúdo exibido.
* **Validação de entrada:** DataAnnotations + regras de negócio (CT07, CT13, CT21, CT28, CT29 → 400; CT23 → 409).

---

## 🗺️ Resumo dos Endpoints

### Autenticação
| Método | Endpoint | Descrição |
| --- | --- | --- |
| **POST** | `/api/auth/login` | Autentica e retorna o token JWT com nome, e-mail e perfil. |

### Regiões e Sensores
| Método | Endpoint | Descrição |
| --- | --- | --- |
| **GET** | `/api/regioes` · `/api/regioes/{id}` | Lista / detalha regiões com o nível de risco atual. |
| **POST** | `/api/regioes` | Cadastra região (admin). |
| **PUT** | `/api/regioes/{id}` | Atualiza região, inclusive ativar/desativar (admin). |
| **GET** | `/api/sensores` · `/api/sensores/{id}` | Lista / detalha sensores e limites. |
| **POST** | `/api/sensores` | Cadastra sensor (admin) — limites `atenção < alerta < perigo`. |
| **PUT** | `/api/sensores/{id}` | Atualiza sensor (admin). |

### Telemetria IoT e Alertas
| Método | Endpoint | Descrição |
| --- | --- | --- |
| **POST** | `/api/medicoes` | Recebe a leitura do sensor (API Key) e processa os alertas. |
| **GET** | `/api/medicoes` · `/api/medicoes/{id}` | Histórico de medições. |
| **GET** | `/api/alertas` · `/api/alertas/{id}` | Central de alertas. |
| **DELETE** | `/api/alertas/{id}` | Exclui alerta (admin). |
| **GET** | `/api/status` | Health-check. |

---

## 📑 Exemplos

### 1. Login
```json
POST /api/auth/login
{ "email": "admin@alertaja.com", "senha": "admin123" }
```
**200 OK**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiraEm": "2026-11-19T13:28:58Z",
  "nome": "Administrador",
  "email": "admin@alertaja.com",
  "role": "ROLE_ADMIN"
}
```

### 2. Cadastrar região (admin)
```json
POST /api/regioes      Authorization: Bearer <JWT>
{ "nome": "QA Automatizado", "cidade": "Divinópolis", "estado": "mg" }
```
**201 Created** (header `Location: /api/Regioes/{id}`) — UF normalizada para `MG`, nível inicial `NORMAL`.

### 3. Enviar medição (sensor IoT)
```json
POST /api/medicoes     X-API-Key: <ALERTAJA_API_KEY>
{ "sensorId": "e39ad137-24d6-4153-bc03-92ab5ad529de", "valor": 72.5 }
```
**201 Created** `{ "mensagem": "Medição Recebida com Sucesso." }` → abre alerta **PERIGO** e a região passa para **PERIGO**.

### 4. Erro de validação
```json
POST /api/sensores     (limites 60 / 40 / 50)
```
**400 Bad Request** `{ "mensagem": "Os limites devem seguir a ordem: atenção < alerta < perigo" }`

### 5. Excluir alerta
`DELETE /api/alertas/{id}` → **204 No Content** (admin) · **403** (cidadão) · **401** (sem token) · **404** (inexistente)

---

## ✅ Resultados dos Testes

| Execução | Casos | Asserções | Arquivo |
| --- | --- | --- | --- |
| 1 — código original | 45 / 49 | 79 / 83 | `relatorios_newman/execucao1_codigo_original.html` |
| 2 — após correções | **49 / 49** | **83 / 83** | `relatorios_newman/execucao2_apos_correcoes.html` |

* `resultados.csv` — resultado de cada caso nas duas execuções.
* `../entrega/Evidencias_Testes_API.pdf` — requisição, resposta e asserções de cada caso.
* `../entrega/PRINTS.pdf` — todos os prints comentados (banco, API, IoT, frontend).
* `capturas_de_tela/` e `logs/` — arquivos originais.

---

## 🛠️ Massa de Dados para Testes Rápidos

* **Admin:** `admin@alertaja.com` / `admin123` · **Cidadãos:** `maria@email.com` / `maria123`, `joao@email.com` / `joao123`
* **Pluviômetro PLUV-001** (`e39ad137-24d6-4153-bc03-92ab5ad529de`) — limites 10 / 25 / 50 mm
* **Nível NIVEL-001** (`99a670e0-5c6c-4310-9ce5-9753fe764c63`) — limites 100 / 200 / 300 cm
* **Região Centro – Nova Serrana/MG** (`bea18d4e-5c6d-40f0-8ff0-e6da0e8cf625`)
