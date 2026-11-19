# Matriz de Cenários de Teste — AlertaJá

Testes de API especificados na Postman Collection [`tests/AlertaJa.postman_collection.json`](../../tests/AlertaJa.postman_collection.json) e executados por linha de comando com **Newman** contra a API real (`https://localhost:7275`) conectada ao Oracle 19c da FIAP, em **19/11/2026**.

| Execução | Código testado | Casos aprovados | Asserções |
| :--- | :--- | :--- | :--- |
| 1 | original (commit `ae52d3e` do repositório do grupo) | 45 / 49 | 79 / 83 |
| 2 | após as correções de [`CORRECOES_QA.md`](../CORRECOES_QA.md) | **49 / 49** | **83 / 83** |

Cobertura: autenticação e JWT, RBAC (401/403), validação de entrada (400), recursos inexistentes (404), conflito (409), CRUD de regiões e sensores, ingestão IoT com API Key, abertura/escalonamento/auto-resolução de alertas, recálculo do risco regional, exclusão de alertas e tentativas de ataque (SQL Injection, token adulterado).

| ID | Módulo | Cenário | Entrada | Saída esperada | Exec. 1 | Exec. 2 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CT01 | Status | **Status da API** — Health-check público. | `GET /api/status` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT02 | Autenticação | **Login administrador (válido)** — Credenciais válidas do perfil ROLE_ADMIN. Salva o token em {{adminToken}}. | `POST /api/auth/login`<br>`{ "email": "admin@alertaja.com", "senha": "{{adminSenha}}" }` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT03 | Autenticação | **Login cidadão (válido)** — Credenciais válidas do perfil ROLE_CIDADAO. Salva o token em {{cidadaoToken}}. | `POST /api/auth/login`<br>`{ "email": "maria@email.com", "senha": "{{cidadaoSenha}}" }` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT04 | Autenticação | **Login com senha incorreta** — Senha errada deve ser rejeitada com mensagem genérica (não revela se o e-mail existe). | `POST /api/auth/login`<br>`{ "email": "admin@alertaja.com", "senha": "senhaErrada" }` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT05 | Autenticação | **Login com e-mail inexistente** — E-mail não cadastrado retorna a mesma mensagem genérica. | `POST /api/auth/login`<br>`{ "email": "naoexiste@alertaja.com", "senha": "qualquer" }` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT06 | Autenticação | **Tentativa de SQL Injection no login** — Payload clássico de SQLi. O EF Core parametriza a consulta, então a string é tratada como dado. | `POST /api/auth/login`<br>`{ "email": "' OR '1'='1' --", "senha": "' OR '1'='1" }` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT07 | Autenticação | **Login com corpo inválido (email nulo)** — Validação automática do [ApiController] para campos obrigatórios. | `POST /api/auth/login`<br>`{ "email": null, "senha": null }` | HTTP 400 | ✅ 400 | ✅ 400 |
| CT08 | Regiões | **Listar regiões** — Lista pública de regiões. | `GET /api/regioes` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT09 | Regiões | **Obter região por id** — Região da carga inicial (Centro - Nova Serrana). | `GET /api/regioes/bea18d4e-5c6d-40f0-8ff0-e6da0e8cf625` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT10 | Regiões | **Obter região inexistente** — GUID válido sem registro. | `GET /api/regioes/00000000-0000-0000-0000-000000000001` | HTTP 404 | ✅ 404 | ✅ 404 |
| CT11 | Regiões | **Criar região sem token** — Operação administrativa sem autenticação. | `POST /api/regioes`<br>`{ "nome": "QA Automatizado", "cidade": "Divinópolis", "estado": "mg" }` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT12 | Regiões | **Criar região como cidadão** — Usuário autenticado sem o papel exigido. | `POST /api/regioes`<br>`{ "nome": "QA Automatizado", "cidade": "Divinópolis", "estado": "mg" }` | HTTP 403 | ✅ 403 | ✅ 403 |
| CT13 | Regiões | **Criar região com dados inválidos** — Nome vazio e UF com 3 caracteres devem ser rejeitados pelas DataAnnotations. | `POST /api/regioes`<br>`{ "nome": "", "cidade": "Divinópolis", "estado": "MGX" }` | HTTP 400 | ✅ 400 | ✅ 400 |
| CT14 | Regiões | **Criar região (admin)** — Cadastro válido. Salva {{novaRegiaoId}}. | `POST /api/regioes`<br>`{ "nome": "QA Automatizado", "cidade": "Divinópolis", "estado": "mg" }` | HTTP 201 | ❌ 201 | ✅ 201 |
| CT15 | Regiões | **Atualizar região (admin)** — Atualização completa da região criada. | `PUT /api/regioes/162136af-6e9d-4c1d-82d6-17ce648c59c2`<br>`{ "nome": "QA Automatizado", "cidade": "Nova Serrana", "estado": "MG", "ativo": true }` | HTTP 200 | ❌ 200 | ✅ 200 |
| CT16 | Regiões | **Atualizar região inexistente** — GUID sem registro. | `PUT /api/regioes/00000000-0000-0000-0000-000000000001`<br>`{ "nome": "X", "cidade": "Y", "estado": "MG", "ativo": true }` | HTTP 404 | ✅ 404 | ✅ 404 |
| CT17 | Sensores | **Listar sensores** — Lista pública de sensores. | `GET /api/sensores` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT18 | Sensores | **Obter sensor por id** — Sensor PLUV-001 da carga inicial. | `GET /api/sensores/e39ad137-24d6-4153-bc03-92ab5ad529de` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT19 | Sensores | **Obter sensor inexistente** — GUID sem registro. | `GET /api/sensores/00000000-0000-0000-0000-000000000001` | HTTP 404 | ✅ 404 | ✅ 404 |
| CT20 | Sensores | **Criar sensor como cidadão** — Cidadão não pode cadastrar sensores. | `POST /api/sensores`<br>`{ "regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}", "tipo": "PLUVIOMETRO", "unidadeMe` | HTTP 403 | ✅ 403 | ✅ 403 |
| CT21 | Sensores | **Criar sensor com limites fora de ordem** — Regra de negócio: atenção < alerta < perigo. Esperado 400 com mensagem de validação. | `POST /api/sensores`<br>`{ "regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}", "tipo": "PLUVIOMETRO", "unidadeMe` | HTTP 400 | ❌ 500 | ✅ 400 |
| CT22 | Sensores | **Criar sensor (admin)** — Cadastro válido na região criada. Salva {{novoSensorId}}. | `POST /api/sensores`<br>`{ "regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}", "tipo": "PLUVIOMETRO", "unidadeMe` | HTTP 201 | ✅ 201 | ✅ 201 |
| CT23 | Sensores | **Criar sensor com código duplicado** — CODIGO_IDENTIFICADOR é UNIQUE. Esperado 409 Conflict (e não erro 500). | `POST /api/sensores`<br>`{ "regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}", "tipo": "PLUVIOMETRO", "unidadeMe` | HTTP 409 | ❌ 500 | ✅ 409 |
| CT24 | Sensores | **Atualizar sensor sem token** — Sem autenticação. | `PUT /api/sensores/ce894934-2a41-48ea-9920-aaca7ab3c903`<br>`{ "regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}", "tipo": "PLUVIOMETRO", "unidadeMe` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT25 | Sensores | **Atualizar sensor (admin)** — Ajusta limites do sensor criado. | `PUT /api/sensores/ce894934-2a41-48ea-9920-aaca7ab3c903`<br>`{ "regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}", "tipo": "PLUVIOMETRO", "unidadeMe` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT26 | Medições e geração de alertas | **Enviar medição sem API Key** — Header X-API-Key ausente. | `POST /api/medicoes`<br>`{ "sensorId": "{{novoSensorId}}", "valor": 5 }` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT27 | Medições e geração de alertas | **Enviar medição com API Key inválida** — Chave incorreta (comparação em tempo constante). | `POST /api/medicoes`<br>`{ "sensorId": "{{novoSensorId}}", "valor": 5 }` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT28 | Medições e geração de alertas | **Enviar medição com valor negativo** — Validação de domínio do valor. | `POST /api/medicoes`<br>`{ "sensorId": "{{novoSensorId}}", "valor": -3 }` | HTTP 400 | ✅ 400 | ✅ 400 |
| CT29 | Medições e geração de alertas | **Enviar medição para sensor inexistente** — Sensor não cadastrado. | `POST /api/medicoes`<br>`{ "sensorId": "00000000-0000-0000-0000-000000000001", "valor": 5 }` | HTTP 400 | ✅ 400 | ✅ 400 |
| CT30 | Medições e geração de alertas | **Medição NORMAL (5 mm)** — Valor abaixo do limite de atenção. | `POST /api/medicoes`<br>`{ "sensorId": "{{novoSensorId}}", "valor": 5 }` | HTTP 201 | ✅ 201 | ✅ 201 |
| CT31 | Medições e geração de alertas | **Região permanece NORMAL** — Nenhum alerta deve ser aberto. | `GET /api/regioes/162136af-6e9d-4c1d-82d6-17ce648c59c2` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT32 | Medições e geração de alertas | **Medição de PERIGO (72,5 mm)** — Valor acima do limite de perigo (55). | `POST /api/medicoes`<br>`{ "sensorId": "{{novoSensorId}}", "valor": 72.5 }` | HTTP 201 | ✅ 201 | ✅ 201 |
| CT33 | Medições e geração de alertas | **Região elevada para PERIGO** — Risco da região recalculado pelos alertas ativos. | `GET /api/regioes/162136af-6e9d-4c1d-82d6-17ce648c59c2` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT34 | Medições e geração de alertas | **Alerta PERIGO criado automaticamente** — Procura alerta ativo do sensor de teste. Salva {{alertaId}}. | `GET /api/alertas` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT35 | Medições e geração de alertas | **Listar medições** — Lista ordenada da mais recente para a mais antiga. Salva {{medicaoId}}. | `GET /api/medicoes` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT36 | Medições e geração de alertas | **Obter medição por id** — Detalhe com unidade de medida. | `GET /api/medicoes/b3b3e269-42b8-47e0-9aa5-d472ab57437a` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT37 | Medições e geração de alertas | **Obter medição inexistente** — GUID sem registro. | `GET /api/medicoes/00000000-0000-0000-0000-000000000001` | HTTP 404 | ✅ 404 | ✅ 404 |
| CT38 | Medições e geração de alertas | **Medição volta ao normal (4 mm)** — Deve resolver o alerta automaticamente. | `POST /api/medicoes`<br>`{ "sensorId": "{{novoSensorId}}", "valor": 4 }` | HTTP 201 | ✅ 201 | ✅ 201 |
| CT39 | Medições e geração de alertas | **Alerta resolvido automaticamente** — Status RESOLVIDO_AUTO e data de resolução. | `GET /api/alertas/88cc153c-f4bd-472c-abc7-54c402112b10` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT40 | Medições e geração de alertas | **Região volta para NORMAL** — Sem alertas ativos. | `GET /api/regioes/162136af-6e9d-4c1d-82d6-17ce648c59c2` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT41 | Alertas | **Listar alertas** — Ordenados por data de emissão (desc). | `GET /api/alertas` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT42 | Alertas | **Obter alerta inexistente** — GUID sem registro. | `GET /api/alertas/00000000-0000-0000-0000-000000000001` | HTTP 404 | ✅ 404 | ✅ 404 |
| CT43 | Alertas | **Excluir alerta sem token** — Sem autenticação. | `DELETE /api/alertas/88cc153c-f4bd-472c-abc7-54c402112b10` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT44 | Alertas | **Excluir alerta como cidadão** — Perfil sem permissão. | `DELETE /api/alertas/88cc153c-f4bd-472c-abc7-54c402112b10` | HTTP 403 | ✅ 403 | ✅ 403 |
| CT45 | Alertas | **Excluir alerta com token adulterado** — Assinatura do JWT alterada: a validação de IssuerSigningKey deve rejeitar. | `DELETE /api/alertas/88cc153c-f4bd-472c-abc7-54c402112b10` | HTTP 401 | ✅ 401 | ✅ 401 |
| CT46 | Alertas | **Excluir alerta (admin)** — Exclusão definitiva. | `DELETE /api/alertas/88cc153c-f4bd-472c-abc7-54c402112b10` | HTTP 204 | ✅ 204 | ✅ 204 |
| CT47 | Alertas | **Excluir alerta já excluído** — Idempotência: recurso não existe mais. | `DELETE /api/alertas/88cc153c-f4bd-472c-abc7-54c402112b10` | HTTP 404 | ✅ 404 | ✅ 404 |
| CT48 | Limpeza | **Desativar sensor de teste** — ativo=false. | `PUT /api/sensores/ce894934-2a41-48ea-9920-aaca7ab3c903`<br>`{ "regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}", "tipo": "PLUVIOMETRO", "unidadeMe` | HTTP 200 | ✅ 200 | ✅ 200 |
| CT49 | Limpeza | **Desativar região de teste** — ativo=false. | `PUT /api/regioes/162136af-6e9d-4c1d-82d6-17ce648c59c2`<br>`{ "nome": "QA Automatizado", "cidade": "Nova Serrana", "estado": "MG", "ativo": false }` | HTTP 200 | ✅ 200 | ✅ 200 |

## Como reproduzir

```powershell
cd tests
npm install
npm test   # gera relatorios/ultima-execucao.html
```

Evidências: `tests/relatorios/run1` e `run2` (HTML, JSON, console), `tests/relatorios/resultados.csv` e `docs/entrega/Evidencias_Testes_API.pdf`.
