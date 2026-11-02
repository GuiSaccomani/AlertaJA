#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Validador Automatizado de Integração Real: Simulador IoT x API AlertaJá
Executa bateria de testes na API real em execução na porta 8080 e audita banco e regras.
"""

import os
import sys
import json
import time
import requests

API_URL = "http://localhost:8080"
API_KEY = os.getenv("SENSOR_INGESTION_API_KEY", "chave-secreta-telemetria-etapa5")

print("=" * 80)
print(" ALERTAJÁ - VALIDAÇÃO INTEGRADA DE TELEMETRIA IoT REAL")
print(" API URL:", API_URL)
print(" X-Sensor-API-Key: [PROTEGIDA / MASCARADA]")
print("=" * 80)

session = requests.Session()

# 1. Autenticação Administrativa
print("\n[ETAPA 1] Autenticando Administrador (admin@alertaja.com)...")
res_login = session.post(f"{API_URL}/api/v1/auth/login", json={"email": "admin@alertaja.com", "senha": "Admin@123456"})
assert res_login.status_code == 200, f"Falha no login: {res_login.status_code} {res_login.text}"
token = res_login.json()["token"]
jwt_headers = {"Authorization": f"Bearer {token}"}
print("-> Autenticado com sucesso! Token JWT obtido.")

# 2. Consulta de Regiões e Sensores Cadastrados
print("\n[ETAPA 2] Consultando Regiões e Sensores...")
res_regioes = session.get(f"{API_URL}/api/v1/regioes", headers=jwt_headers)
assert res_regioes.status_code == 200
regioes = res_regioes.json()["content"]
assert len(regioes) > 0, "Nenhuma região cadastrada"
regiao = regioes[0]
regiao_id = regiao["id"]
print(f"-> Região ativa: ID {regiao_id} | Nome: {regiao['nome']} | Risco Atual: {regiao['nivelRiscoAtual']}")

res_sensores = session.get(f"{API_URL}/api/v1/sensores", headers=jwt_headers)
assert res_sensores.status_code == 200
sensores = res_sensores.json()["content"]
print(f"-> Sensores encontrados ({len(sensores)}):")
for s in sensores:
    print(f"   * Código: {s['codigoIdentificador']} | Tipo: {s['tipo']} | Limites: Atenção={s['limiteAtencao']}, Alerta={s['limiteAlerta']}, Perigo={s['limitePerigo']}")

# 3. Teste de Proteção de Segurança por X-Sensor-API-Key
print("\n[ETAPA 3] Validando Proteção por X-Sensor-API-Key...")
res_sem_key = session.post(f"{API_URL}/api/v1/medicoes", json={"sensorCodigo": "PLUV-SUL-01", "valor": 10.0})
print(f"-> Envio SEM API Key: HTTP {res_sem_key.status_code} (Esperado: 401)")
assert res_sem_key.status_code == 401, f"Deveria rejeitar sem chave, retornou {res_sem_key.status_code}"

res_key_invalida = session.post(f"{API_URL}/api/v1/medicoes",
                                json={"sensorCodigo": "PLUV-SUL-01", "valor": 10.0},
                                headers={"X-Sensor-API-Key": "chave-falsa-invalida"})
print(f"-> Envio com API Key INVÁLIDA: HTTP {res_key_invalida.status_code} (Esperado: 401)")
assert res_key_invalida.status_code == 401, f"Deveria rejeitar chave inválida, retornou {res_key_invalida.status_code}"

telemetria_headers = {"X-Sensor-API-Key": API_KEY, "Content-Type": "application/json"}

# 4. Ingestão Cenário 1: NORMAL
print("\n[ETAPA 4] Cenário 1: Leitura em Nível NORMAL (Pluviômetro = 5.0 mm/h)...")
res_c1 = session.post(f"{API_URL}/api/v1/medicoes",
                      json={"sensorCodigo": "PLUV-SUL-01", "valor": 5.0},
                      headers=telemetria_headers)
assert res_c1.status_code == 201
dados_c1 = res_c1.json()
print(f"-> Medição ID {dados_c1['id']} persistida | Nível Detectado: {dados_c1['nivelRiscoDetectado']}")
assert dados_c1["nivelRiscoDetectado"] == "NORMAL"

res_alertas = session.get(f"{API_URL}/api/v1/alertas?ativo=true", headers=jwt_headers)
print(f"-> Alertas ativos no sistema: {len(res_alertas.json()['content'])} (Esperado: 0)")
assert len(res_alertas.json()["content"]) == 0

# 5. Ingestão Cenário 2: ATENCAO e Anti-duplicação
print("\n[ETAPA 5] Cenário 2: Leitura em ATENÇÃO (Pluviômetro = 25.0 mm/h)...")
res_c2 = session.post(f"{API_URL}/api/v1/medicoes",
                      json={"sensorCodigo": "PLUV-SUL-01", "valor": 25.0},
                      headers=telemetria_headers)
assert res_c2.status_code == 201
dados_c2 = res_c2.json()
print(f"-> Medição ID {dados_c2['id']} persistida | Nível Detectado: {dados_c2['nivelRiscoDetectado']}")
assert dados_c2["nivelRiscoDetectado"] == "ATENCAO"

res_alertas_atencao = session.get(f"{API_URL}/api/v1/alertas?ativo=true", headers=jwt_headers)
alertas_ativos = res_alertas_atencao.json()["content"]
assert len(alertas_ativos) == 1, "Deveria haver 1 alerta ativo"
alerta_atencao = alertas_ativos[0]
alerta_atencao_id = alerta_atencao["id"]
print(f"-> Alerta criado com sucesso: ID {alerta_atencao_id} | Nível: {alerta_atencao['nivel']} | Status: {alerta_atencao['status']}")

print("-> Testando ANTI-DUPLICAÇÃO: enviando nova leitura no mesmo nível (28.0 mm/h)...")
res_c2_dupl = session.post(f"{API_URL}/api/v1/medicoes",
                           json={"sensorCodigo": "PLUV-SUL-01", "valor": 28.0},
                           headers=telemetria_headers)
assert res_c2_dupl.status_code == 201
res_alertas_pos_dupl = session.get(f"{API_URL}/api/v1/alertas?ativo=true", headers=jwt_headers)
alertas_pos_dupl = res_alertas_pos_dupl.json()["content"]
print(f"-> Alertas ativos após 2ª medição: {len(alertas_pos_dupl)} (Manteve 1 alerta, sem duplicidade!)")
assert len(alertas_pos_dupl) == 1
assert alertas_pos_dupl[0]["id"] == alerta_atencao_id
assert alertas_pos_dupl[0]["medicaoUltimaId"] == res_c2_dupl.json()["id"]

# 6. Ingestão Cenário 3: Escalonamento para ALERTA
print("\n[ETAPA 6] Cenário 3: Escalonamento para ALERTA (Pluviômetro = 45.0 mm/h)...")
res_c3 = session.post(f"{API_URL}/api/v1/medicoes",
                      json={"sensorCodigo": "PLUV-SUL-01", "valor": 45.0},
                      headers=telemetria_headers)
assert res_c3.status_code == 201
dados_c3 = res_c3.json()
print(f"-> Medição ID {dados_c3['id']} persistida | Nível Detectado: {dados_c3['nivelRiscoDetectado']}")
assert dados_c3["nivelRiscoDetectado"] == "ALERTA"

res_alertas_pos_c3 = session.get(f"{API_URL}/api/v1/alertas?ativo=true", headers=jwt_headers)
alertas_c3 = res_alertas_pos_c3.json()["content"]
print(f"-> Alerta ativo atual: ID {alertas_c3[0]['id']} | Nível: {alertas_c3[0]['nivel']}")
assert alertas_c3[0]["nivel"] == "ALERTA"
assert alertas_c3[0]["id"] != alerta_atencao_id, "Novo alerta deveria ter sido aberto"

# Confere se o alerta anterior foi arquivado como RESOLVIDO_AUTO
res_alerta_ant = session.get(f"{API_URL}/api/v1/alertas?sensorId={dados_c3['sensorId']}", headers=jwt_headers)
historico = res_alerta_ant.json()["content"]
alerta_antigo_resolvido = [a for a in historico if a["id"] == alerta_atencao_id][0]
print(f"-> Alerta anterior (ID {alerta_atencao_id}) resolvido automaticamente: Status: {alerta_antigo_resolvido['status']}")
assert alerta_antigo_resolvido["status"] == "RESOLVIDO_AUTO"
assert alerta_antigo_resolvido["ativo"] == False

# 7. Ingestão Cenário 4: Escalonamento para PERIGO
print("\n[ETAPA 7] Cenário 4: Escalonamento para PERIGO (Pluviômetro = 72.0 mm/h)...")
res_c4 = session.post(f"{API_URL}/api/v1/medicoes",
                      json={"sensorCodigo": "PLUV-SUL-01", "valor": 72.0},
                      headers=telemetria_headers)
assert res_c4.status_code == 201
dados_c4 = res_c4.json()
print(f"-> Medição ID {dados_c4['id']} persistida | Nível Detectado: {dados_c4['nivelRiscoDetectado']}")
assert dados_c4["nivelRiscoDetectado"] == "PERIGO"

res_regiao_c4 = session.get(f"{API_URL}/api/v1/regioes/{regiao_id}", headers=jwt_headers)
print(f"-> Risco Regional recalculado: {res_regiao_c4.json()['nivelRiscoAtual']} (Esperado: PERIGO)")
assert res_regiao_c4.json()["nivelRiscoAtual"] == "PERIGO"

# 8. Ingestão Cenário 5: Recuperação e Auto-Resolução
print("\n[ETAPA 8] Cenário 5: Recuperação e Retorno a NORMAL (Pluviômetro = 5.0 mm/h)...")
res_c5 = session.post(f"{API_URL}/api/v1/medicoes",
                      json={"sensorCodigo": "PLUV-SUL-01", "valor": 5.0},
                      headers=telemetria_headers)
assert res_c5.status_code == 201
print(f"-> Medição ID {res_c5.json()['id']} persistida | Nível Detectado: NORMAL")

res_alertas_pos_c5 = session.get(f"{API_URL}/api/v1/alertas?ativo=true", headers=jwt_headers)
print(f"-> Alertas ativos após retorno a normal: {len(res_alertas_pos_c5.json()['content'])} (Esperado: 0)")
assert len(res_alertas_pos_c5.json()["content"]) == 0

res_regiao_c5 = session.get(f"{API_URL}/api/v1/regioes/{regiao_id}", headers=jwt_headers)
print(f"-> Risco Regional recalculado: {res_regiao_c5.json()['nivelRiscoAtual']} (Esperado: NORMAL)")
assert res_regiao_c5.json()["nivelRiscoAtual"] == "NORMAL"

# 9. Ingestão Cenário 6: Múltiplos Sensores e Integridade do Risco Regional
print("\n[ETAPA 9] Cenário 6: Múltiplos Sensores na Região...")
print("  Passo 6.1: Pluviômetro entra em PERIGO (75.0 mm/h)")
res_pluv_perigo = session.post(f"{API_URL}/api/v1/medicoes", json={"sensorCodigo": "PLUV-SUL-01", "valor": 75.0}, headers=telemetria_headers)
assert res_pluv_perigo.status_code == 201

print("  Passo 6.2: Sensor de Nível do Rio entra em ATENÇÃO (3.0 m)")
res_rio_atencao = session.post(f"{API_URL}/api/v1/medicoes", json={"sensorCodigo": "NIVEL-RIO-01", "valor": 3.0}, headers=telemetria_headers)
assert res_rio_atencao.status_code == 201

res_reg_62 = session.get(f"{API_URL}/api/v1/regioes/{regiao_id}", headers=jwt_headers)
print(f"  => Risco Regional atual: {res_reg_62.json()['nivelRiscoAtual']} (Esperado: PERIGO)")
assert res_reg_62.json()["nivelRiscoAtual"] == "PERIGO"

print("  Passo 6.3: Pluviômetro normaliza (5.0 mm/h)")
res_pluv_norm = session.post(f"{API_URL}/api/v1/medicoes", json={"sensorCodigo": "PLUV-SUL-01", "valor": 5.0}, headers=telemetria_headers)
assert res_pluv_norm.status_code == 201

res_reg_63 = session.get(f"{API_URL}/api/v1/regioes/{regiao_id}", headers=jwt_headers)
print(f"  => Risco Regional após normalização da chuva: {res_reg_63.json()['nivelRiscoAtual']} (Esperado: ATENCAO, preservando o risco do rio!)")
assert res_reg_63.json()["nivelRiscoAtual"] == "ATENCAO", "O risco regional NÃO deve ir para NORMAL enquanto o rio estiver em ATENCAO!"

print("  Passo 6.4: Rio normaliza (1.0 m)")
res_rio_norm = session.post(f"{API_URL}/api/v1/medicoes", json={"sensorCodigo": "NIVEL-RIO-01", "valor": 1.0}, headers=telemetria_headers)
assert res_rio_norm.status_code == 201

res_reg_64 = session.get(f"{API_URL}/api/v1/regioes/{regiao_id}", headers=jwt_headers)
print(f"  => Risco Regional final após normalização de ambos: {res_reg_64.json()['nivelRiscoAtual']} (Esperado: NORMAL)")
assert res_reg_64.json()["nivelRiscoAtual"] == "NORMAL"

print("\n" + "=" * 80)
print(" TODOS OS TESTES E CENÁRIOS DE INTEGRAÇÃO PASSARAM COM 100% DE SUCESSO!")
print("=" * 80)
