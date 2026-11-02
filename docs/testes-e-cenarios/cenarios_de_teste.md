# AlertaJá - Matriz de Cenários de Teste e Validação Integrada

Este documento consolida a execução e os resultados reais obtidos na bateria de testes do sistema **AlertaJá**, cobrindo o ciclo de vida completo de autenticação, ingestão telemétrica de IoT, regras de negócio do motor de alertas, recálculo regional e segurança.

---

## Matriz dos Cenários de Teste

| # | Cenário de Teste | Dados de Entrada | Resultado Esperado | Resultado Obtido Real | Status |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **1** | **Cadastro de Cidadão** | `POST /api/v1/auth/register`<br>`nome: "Carlos Cidadão"`<br>`email: "carlos@alertaja.com"`<br>`senha: "Cidadao@123456"` | Criação da conta com hash BCrypt, atribuição automática do papel `ROLE_CIDADAO` e retorno de Token JWT (`HTTP 201`). | Conta cadastrada com sucesso, token JWT gerado e atribuída authority `ROLE_CIDADAO`. | **APROVADO** |
| **2** | **Proteção de Rota Admin por RBAC** | `POST /api/v1/regioes`<br>Bearer Token de `ROLE_CIDADAO`<br>`nome: "Bacia Nova"` | Rejeição imediata da requisição com código `HTTP 403 Forbidden` devido à falta da autoridade `ROLE_ADMIN`. | `HTTP 403 Forbidden` retornado. Cidadão impedido de realizar operações administrativas. | **APROVADO** |
| **3** | **Ingestão sem X-Sensor-API-Key** | `POST /api/v1/medicoes`<br>Sem cabeçalho `X-Sensor-API-Key`<br>`sensorCodigo: "PLUV-SUL-01"` | Rejeição no filtro de segurança da telemetria com código `HTTP 401 Unauthorized`. | `HTTP 401 Unauthorized` retornado. Acesso anônimo rejeitado. | **APROVADO** |
| **4** | **Ingestão em Nível NORMAL** | `POST /api/v1/medicoes`<br>`X-Sensor-API-Key: [VÁLIDA]`<br>`sensorCodigo: "PLUV-SUL-01"`<br>`valor: 5.0 mm/h` | Persistência da medição (`HTTP 201`), nível detectado `NORMAL`, nenhum alerta gerado, risco da região em `NORMAL`. | Medição ID 1 persistida, `nivelRiscoDetectado: NORMAL`, 0 alertas abertos, região em `NORMAL`. | **APROVADO** |
| **5** | **Disparo de Alerta: Nível ATENÇÃO** | `POST /api/v1/medicoes`<br>`sensorCodigo: "PLUV-SUL-01"`<br>`valor: 25.0 mm/h` (Limite: 20.0) | Persistência da medição, abertura de novo alerta com `nivel = ATENCAO`, `status = ATIVO` e risco regional `ATENCAO`. | Medição ID 2 persistida, Alerta ID 1 criado com `status: ATIVO` e região assumiu `ATENCAO`. | **APROVADO** |
| **6** | **Anti-duplicação de Alertas Ativos** | `POST /api/v1/medicoes`<br>`sensorCodigo: "PLUV-SUL-01"`<br>`valor: 28.0 mm/h` (mesmo limiar) | **Não duplicar alerta.** Atualizar `data_ultima_ocorrencia` e `medicao_ultima_id` no alerta ativo existente. | Total de alertas ativos mantido em 1. O alerta existente teve o carimbo da última ocorrência atualizado. | **APROVADO** |
| **7** | **Escalonamento para Nível ALERTA** | `POST /api/v1/medicoes`<br>`sensorCodigo: "PLUV-SUL-01"`<br>`valor: 45.0 mm/h` (Limite: 40.0) | Alerta anterior de `ATENCAO` arquivado com `RESOLVIDO_AUTO`. Novo alerta gerado com nível `ALERTA`. | Alerta anterior encerrado com `status: RESOLVIDO_AUTO` e novo alerta aberto com `nivel: ALERTA`. | **APROVADO** |
| **8** | **Escalonamento para Nível PERIGO** | `POST /api/v1/medicoes`<br>`sensorCodigo: "PLUV-SUL-01"`<br>`valor: 72.0 mm/h` (Limite: 60.0) | Alerta de `ALERTA` arquivado. Novo alerta gerado em nível `PERIGO`. Risco regional passa para `PERIGO`. | Alerta de `ALERTA` finalizado e novo alerta aberto em `PERIGO`. Região assumiu `PERIGO`. | **APROVADO** |
| **9** | **Recuperação Automática (Auto-resolução)** | `POST /api/v1/medicoes`<br>`sensorCodigo: "PLUV-SUL-01"`<br>`valor: 5.0 mm/h` (NORMAL) | Todos os alertas ativos do sensor são encerrados com `RESOLVIDO_AUTO`. Risco regional normaliza para `NORMAL`. | Alertas ativos reduzidos para 0. Alerta arquivado com `RESOLVIDO_AUTO` e região retornou a `NORMAL`. | **APROVADO** |
| **10** | **Multi-sensores e Recálculo Regional** | Sensor A (`PLUV-SUL-01`) em `PERIGO`<br>Sensor B (`NIVEL-RIO-01`) em `ATENCAO`<br>Depois, Sensor A volta para `NORMAL` | Ao normalizar a chuva no Sensor A, o risco regional **NÃO** pode ir para NORMAL! Deve assumir `ATENCAO` preservando o risco do rio. | Região permaneceu em `ATENCAO`. Apenas quando o Sensor B normalizou a região voltou para `NORMAL`. | **APROVADO** |
| **11** | **Resolução Manual de Alerta por Admin** | `PATCH /api/v1/alertas/{id}/resolver`<br>Bearer Token de `ROLE_ADMIN` | Alerta ativo tem status alterado para `RESOLVIDO_MANUAL`, `ativo = false` e carimbo `data_resolucao` registrado. | Alerta resolvido com `HTTP 200`, `status: RESOLVIDO_MANUAL`, `ativo: false` e data de resolução registrada. | **APROVADO** |
| **12** | **Rollback Transacional em Falha** | Ingestão com falha crítica forçada no motor de alertas (`RuntimeException`) | Reversão completa da transação Spring (`@Transactional`). A medição **não** pode ficar órfã no banco. | Contagem de medições no banco permaneceu inalterada. Rollback transacional validado com sucesso. | **APROVADO** |
| **13** | **Soft Delete e Ingestão em Sensor Inativo** | `DELETE /api/v1/sensores/{id}` (Admin)<br>Depois: `POST /api/v1/medicoes` para o sensor | Sensor tem `ativo = false`. Ao tentar ingerir medições para o sensor desativado, o sistema rejeita (`HTTP 400`). | Sensor desativado logicamente sem exclusão física. Ingestão subsequente rejeitada com `RegraNegocioException`. | **APROVADO** |

---

## Resumo dos Testes Automatizados Executados

```
[INFO] ------------------------------------------------------------------------
[INFO] Results:
[INFO] Tests run: 48, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```
* **Backend Spring Boot:** 48 testes de unidade e integração aprovados (100% de sucesso).
* **Frontend React:** Build de produção aprovado via `npm run build` (0 erros de tipagem).
* **Simulador IoT:** Validação integrada de ponta a ponta aprovada via `simulator/verify_integration.py`.
