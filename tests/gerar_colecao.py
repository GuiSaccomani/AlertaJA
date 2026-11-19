# -*- coding: utf-8 -*-
"""Gera a Postman Collection v2.1 do AlertaJá com scripts de teste (pm.test)."""
import json, sys, uuid

REGIAO_SEED = "bea18d4e-5c6d-40f0-8ff0-e6da0e8cf625"   # Centro - Nova Serrana (DML)
SENSOR_SEED = "e39ad137-24d6-4153-bc03-92ab5ad529de"   # PLUV-001 (DML)
GUID_INEXISTENTE = "00000000-0000-0000-0000-000000000001"

def js(*lines):
    return {"listen": "test", "script": {"type": "text/javascript", "exec": list(lines)}}

def pre(*lines):
    return {"listen": "prerequest", "script": {"type": "text/javascript", "exec": list(lines)}}

def status(code, name=None):
    return f'pm.test("{name or "Status " + str(code)}", () => pm.response.to.have.status({code}));'

def req(name, method, path, desc, tests, body=None, auth=None, headers=None, prereq=None):
    h = [{"key": "Content-Type", "value": "application/json"}] if body is not None else []
    for k, v in (headers or {}).items():
        h.append({"key": k, "value": v})
    r = {"method": method, "header": h,
         "url": {"raw": "{{baseUrl}}" + path, "host": ["{{baseUrl}}"],
                 "path": [p for p in path.strip("/").split("/")]},
         "description": desc}
    if body is not None:
        r["body"] = {"mode": "raw", "raw": json.dumps(body, ensure_ascii=False, indent=2)
                     if not isinstance(body, str) else body,
                     "options": {"raw": {"language": "json"}}}
    if auth == "none":
        r["auth"] = {"type": "noauth"}
    elif auth:
        r["auth"] = {"type": "bearer", "bearer": [{"key": "token", "value": "{{" + auth + "}}", "type": "string"}]}
    else:
        r["auth"] = {"type": "noauth"}
    ev = [js(*tests)]
    if prereq:
        ev.insert(0, pre(*prereq))
    return {"name": name, "event": ev, "request": r}

def folder(name, desc, items):
    return {"name": name, "description": desc, "item": items}

regiao_valida = {"nome": "QA Automatizado", "cidade": "Divinópolis", "estado": "mg"}
sensor_valido = {"regiaoId": "{{novaRegiaoId}}", "codigoIdentificador": "{{sensorCodigo}}",
                 "tipo": "PLUVIOMETRO", "unidadeMedida": "mm",
                 "limiteAtencao": 10, "limiteAlerta": 25, "limitePerigo": 50}

items = [
 folder("00 - Status", "Verificação de disponibilidade da API.", [
  req("CT01 - Status da API", "GET", "/api/status", "Health-check público.",
      [status(200), 'pm.test("Sistema online", () => pm.expect(pm.response.json().status).to.eql("Online"));']),
 ]),
 folder("01 - Autenticação", "Login com e-mail/senha (hash PBKDF2 via PasswordHasher) e emissão de JWT.", [
  req("CT02 - Login administrador (válido)", "POST", "/api/auth/login",
      "Credenciais válidas do perfil ROLE_ADMIN. Salva o token em {{adminToken}}.",
      [status(200), "const j = pm.response.json();",
       'pm.test("Retorna token JWT", () => pm.expect(j.token.split(".").length).to.eql(3));',
       'pm.test("Perfil ROLE_ADMIN", () => pm.expect(j.role).to.eql("ROLE_ADMIN"));',
       'pm.test("Resposta não expõe a senha", () => pm.expect(j).to.not.have.property("senha"));',
       'pm.collectionVariables.set("adminToken", j.token);'],
      body={"email": "admin@alertaja.com", "senha": "{{adminSenha}}"}),
  req("CT03 - Login cidadão (válido)", "POST", "/api/auth/login",
      "Credenciais válidas do perfil ROLE_CIDADAO. Salva o token em {{cidadaoToken}}.",
      [status(200), "const j = pm.response.json();",
       'pm.test("Perfil ROLE_CIDADAO", () => pm.expect(j.role).to.eql("ROLE_CIDADAO"));',
       'pm.collectionVariables.set("cidadaoToken", j.token);'],
      body={"email": "maria@email.com", "senha": "{{cidadaoSenha}}"}),
  req("CT04 - Login com senha incorreta", "POST", "/api/auth/login",
      "Senha errada deve ser rejeitada com mensagem genérica (não revela se o e-mail existe).",
      [status(401), 'pm.test("Mensagem genérica", () => pm.expect(pm.response.json().mensagem).to.eql("E-mail ou senha inválidos."));'],
      body={"email": "admin@alertaja.com", "senha": "senhaErrada"}),
  req("CT05 - Login com e-mail inexistente", "POST", "/api/auth/login",
      "E-mail não cadastrado retorna a mesma mensagem genérica.",
      [status(401), 'pm.test("Mensagem genérica", () => pm.expect(pm.response.json().mensagem).to.eql("E-mail ou senha inválidos."));'],
      body={"email": "naoexiste@alertaja.com", "senha": "qualquer"}),
  req("CT06 - Tentativa de SQL Injection no login", "POST", "/api/auth/login",
      "Payload clássico de SQLi. O EF Core parametriza a consulta, então a string é tratada como dado.",
      [status(401, "SQLi não autentica (401)")],
      body={"email": "' OR '1'='1' --", "senha": "' OR '1'='1"}),
  req("CT07 - Login com corpo inválido (email nulo)", "POST", "/api/auth/login",
      "Validação automática do [ApiController] para campos obrigatórios.",
      [status(400)], body={"email": None, "senha": None}),
 ]),
 folder("02 - Regiões", "CRUD de regiões monitoradas. GET público; POST/PUT exigem ROLE_ADMIN.", [
  req("CT08 - Listar regiões", "GET", "/api/regioes", "Lista pública de regiões.",
      [status(200), 'pm.test("Retorna array com regiões", () => pm.expect(pm.response.json()).to.be.an("array").that.is.not.empty);']),
  req("CT09 - Obter região por id", "GET", "/api/regioes/" + REGIAO_SEED, "Região da carga inicial (Centro - Nova Serrana).",
      [status(200), 'pm.test("Id confere", () => pm.expect(pm.response.json().id).to.eql("' + REGIAO_SEED + '"));']),
  req("CT10 - Obter região inexistente", "GET", "/api/regioes/" + GUID_INEXISTENTE, "GUID válido sem registro.",
      [status(404)]),
  req("CT11 - Criar região sem token", "POST", "/api/regioes", "Operação administrativa sem autenticação.",
      [status(401)], body=regiao_valida, auth="none"),
  req("CT12 - Criar região como cidadão", "POST", "/api/regioes", "Usuário autenticado sem o papel exigido.",
      [status(403)], body=regiao_valida, auth="cidadaoToken"),
  req("CT13 - Criar região com dados inválidos", "POST", "/api/regioes",
      "Nome vazio e UF com 3 caracteres devem ser rejeitados pelas DataAnnotations.",
      [status(400), "const e = pm.response.json().errors || {};",
       'pm.test("Aponta erro em Nome e Estado", () => { pm.expect(Object.keys(e).join()).to.match(/Nome/i); pm.expect(Object.keys(e).join()).to.match(/Estado/i); });'],
      body={"nome": "", "cidade": "Divinópolis", "estado": "MGX"}, auth="adminToken"),
  req("CT14 - Criar região (admin)", "POST", "/api/regioes", "Cadastro válido. Salva {{novaRegiaoId}}.",
      [status(201), "const j = pm.response.json();",
       'pm.test("Header Location presente", () => pm.expect(pm.response.headers.get("Location")).to.include(j.id));',
       'pm.test("UF normalizada para maiúsculas", () => pm.expect(j.estado).to.eql("MG"));',
       'pm.test("Nível inicial NORMAL", () => pm.expect(j.nivelRiscoAtual).to.eql("NORMAL"));',
       'pm.test("Data de criação preenchida", () => pm.expect(j.criadoEm).to.not.match(/^0001-01-01/));',
       'pm.collectionVariables.set("novaRegiaoId", j.id);'],
      body=regiao_valida, auth="adminToken"),
  req("CT15 - Atualizar região (admin)", "PUT", "/api/regioes/{{novaRegiaoId}}", "Atualização completa da região criada.",
      [status(200), "const j = pm.response.json();",
       'pm.test("Cidade atualizada", () => pm.expect(j.cidade).to.eql("Nova Serrana"));',
       'pm.test("Campo ativo refletido na resposta", () => pm.expect(j.ativo).to.eql(true));'],
      body={"nome": "QA Automatizado", "cidade": "Nova Serrana", "estado": "MG", "ativo": True}, auth="adminToken"),
  req("CT16 - Atualizar região inexistente", "PUT", "/api/regioes/" + GUID_INEXISTENTE, "GUID sem registro.",
      [status(404)], body={"nome": "X", "cidade": "Y", "estado": "MG", "ativo": True}, auth="adminToken"),
 ]),
 folder("03 - Sensores", "CRUD de sensores com limites atenção < alerta < perigo.", [
  req("CT17 - Listar sensores", "GET", "/api/sensores", "Lista pública de sensores.",
      [status(200), 'pm.test("Tipos serializados como texto", () => pm.expect(["PLUVIOMETRO","NIVEL_AGUA"]).to.include(pm.response.json()[0].tipo));']),
  req("CT18 - Obter sensor por id", "GET", "/api/sensores/" + SENSOR_SEED, "Sensor PLUV-001 da carga inicial.",
      [status(200), 'pm.test("Código PLUV-001", () => pm.expect(pm.response.json().codigoIdentificador).to.eql("PLUV-001"));']),
  req("CT19 - Obter sensor inexistente", "GET", "/api/sensores/" + GUID_INEXISTENTE, "GUID sem registro.", [status(404)]),
  req("CT20 - Criar sensor como cidadão", "POST", "/api/sensores", "Cidadão não pode cadastrar sensores.",
      [status(403)], body=sensor_valido, auth="cidadaoToken",
      prereq=['pm.collectionVariables.set("sensorCodigo", "QA-" + Date.now());']),
  req("CT21 - Criar sensor com limites fora de ordem", "POST", "/api/sensores",
      "Regra de negócio: atenção < alerta < perigo. Esperado 400 com mensagem de validação.",
      [status(400), 'pm.test("Mensagem explica a ordem dos limites", () => pm.expect(pm.response.text()).to.include("atenção < alerta < perigo"));'],
      body=dict(sensor_valido, limiteAtencao=60, limiteAlerta=40, limitePerigo=50), auth="adminToken"),
  req("CT22 - Criar sensor (admin)", "POST", "/api/sensores", "Cadastro válido na região criada. Salva {{novoSensorId}}.",
      [status(201), "const j = pm.response.json();",
       'pm.test("Sensor ativo por padrão", () => pm.expect(j.ativo).to.eql(true));',
       'pm.collectionVariables.set("novoSensorId", j.id);'],
      body=sensor_valido, auth="adminToken"),
  req("CT23 - Criar sensor com código duplicado", "POST", "/api/sensores",
      "CODIGO_IDENTIFICADOR é UNIQUE. Esperado 409 Conflict (e não erro 500).",
      [status(409)], body=sensor_valido, auth="adminToken"),
  req("CT24 - Atualizar sensor sem token", "PUT", "/api/sensores/{{novoSensorId}}", "Sem autenticação.",
      [status(401)], body=sensor_valido, auth="none"),
  req("CT25 - Atualizar sensor (admin)", "PUT", "/api/sensores/{{novoSensorId}}", "Ajusta limites do sensor criado.",
      [status(200), 'pm.test("Limite de perigo atualizado", () => pm.expect(pm.response.json().limitePerigo).to.eql(55));'],
      body=dict(sensor_valido, limitePerigo=55, ativo=True), auth="adminToken"),
 ]),
 folder("04 - Medições e geração de alertas", "Ingestão IoT protegida por X-API-Key e processamento automático de alertas.", [
  req("CT26 - Enviar medição sem API Key", "POST", "/api/medicoes", "Header X-API-Key ausente.",
      [status(401)], body={"sensorId": "{{novoSensorId}}", "valor": 5}),
  req("CT27 - Enviar medição com API Key inválida", "POST", "/api/medicoes", "Chave incorreta (comparação em tempo constante).",
      [status(401)], body={"sensorId": "{{novoSensorId}}", "valor": 5}, headers={"X-API-Key": "chave-invalida"}),
  req("CT28 - Enviar medição com valor negativo", "POST", "/api/medicoes", "Validação de domínio do valor.",
      [status(400), 'pm.test("Mensagem de validação", () => pm.expect(pm.response.json().mensagem).to.include("negativo"));'],
      body={"sensorId": "{{novoSensorId}}", "valor": -3}, headers={"X-API-Key": "{{apiKey}}"}),
  req("CT29 - Enviar medição para sensor inexistente", "POST", "/api/medicoes", "Sensor não cadastrado.",
      [status(400), 'pm.test("Mensagem de sensor inexistente", () => pm.expect(pm.response.json().mensagem).to.include("não existe"));'],
      body={"sensorId": GUID_INEXISTENTE, "valor": 5}, headers={"X-API-Key": "{{apiKey}}"}),
  req("CT30 - Medição NORMAL (5 mm)", "POST", "/api/medicoes", "Valor abaixo do limite de atenção.",
      [status(201)], body={"sensorId": "{{novoSensorId}}", "valor": 5}, headers={"X-API-Key": "{{apiKey}}"}),
  req("CT31 - Região permanece NORMAL", "GET", "/api/regioes/{{novaRegiaoId}}", "Nenhum alerta deve ser aberto.",
      [status(200), 'pm.test("nivelRiscoAtual = NORMAL", () => pm.expect(pm.response.json().nivelRiscoAtual).to.eql("NORMAL"));']),
  req("CT32 - Medição de PERIGO (72,5 mm)", "POST", "/api/medicoes", "Valor acima do limite de perigo (55).",
      [status(201)], body={"sensorId": "{{novoSensorId}}", "valor": 72.5}, headers={"X-API-Key": "{{apiKey}}"}),
  req("CT33 - Região elevada para PERIGO", "GET", "/api/regioes/{{novaRegiaoId}}", "Risco da região recalculado pelos alertas ativos.",
      [status(200), 'pm.test("nivelRiscoAtual = PERIGO", () => pm.expect(pm.response.json().nivelRiscoAtual).to.eql("PERIGO"));']),
  req("CT34 - Alerta PERIGO criado automaticamente", "GET", "/api/alertas", "Procura alerta ativo do sensor de teste. Salva {{alertaId}}.",
      [status(200), 'const a = pm.response.json().find(x => x.sensorId === pm.collectionVariables.get("novoSensorId") && x.ativo);',
       'pm.test("Existe alerta ativo para o sensor", () => pm.expect(a).to.be.an("object"));',
       'pm.test("Nível PERIGO / status ATIVO", () => { pm.expect(a.nivel).to.eql("PERIGO"); pm.expect(a.status).to.eql("ATIVO"); });',
       'if (a) pm.collectionVariables.set("alertaId", a.id);']),
  req("CT35 - Listar medições", "GET", "/api/medicoes", "Lista ordenada da mais recente para a mais antiga. Salva {{medicaoId}}.",
      [status(200), 'const m = pm.response.json().find(x => x.sensorId === pm.collectionVariables.get("novoSensorId"));',
       'pm.test("Medição de teste registrada", () => pm.expect(m.valor).to.eql(72.5));',
       'pm.collectionVariables.set("medicaoId", m.id);']),
  req("CT36 - Obter medição por id", "GET", "/api/medicoes/{{medicaoId}}", "Detalhe com unidade de medida.",
      [status(200), 'pm.test("Unidade mm", () => pm.expect(pm.response.json().unidadeMedida).to.eql("mm"));']),
  req("CT37 - Obter medição inexistente", "GET", "/api/medicoes/" + GUID_INEXISTENTE, "GUID sem registro.", [status(404)]),
  req("CT38 - Medição volta ao normal (4 mm)", "POST", "/api/medicoes", "Deve resolver o alerta automaticamente.",
      [status(201)], body={"sensorId": "{{novoSensorId}}", "valor": 4}, headers={"X-API-Key": "{{apiKey}}"}),
  req("CT39 - Alerta resolvido automaticamente", "GET", "/api/alertas/{{alertaId}}", "Status RESOLVIDO_AUTO e data de resolução.",
      [status(200), "const j = pm.response.json();",
       'pm.test("Status RESOLVIDO_AUTO", () => pm.expect(j.status).to.eql("RESOLVIDO_AUTO"));',
       'pm.test("Inativo com data de resolução", () => { pm.expect(j.ativo).to.eql(false); pm.expect(j.dataResolucao).to.be.a("string"); });']),
  req("CT40 - Região volta para NORMAL", "GET", "/api/regioes/{{novaRegiaoId}}", "Sem alertas ativos.",
      [status(200), 'pm.test("nivelRiscoAtual = NORMAL", () => pm.expect(pm.response.json().nivelRiscoAtual).to.eql("NORMAL"));']),
 ]),
 folder("05 - Alertas", "Consulta pública e exclusão restrita a ROLE_ADMIN.", [
  req("CT41 - Listar alertas", "GET", "/api/alertas", "Ordenados por data de emissão (desc).",
      [status(200), 'pm.test("Retorna array", () => pm.expect(pm.response.json()).to.be.an("array"));']),
  req("CT42 - Obter alerta inexistente", "GET", "/api/alertas/" + GUID_INEXISTENTE, "GUID sem registro.", [status(404)]),
  req("CT43 - Excluir alerta sem token", "DELETE", "/api/alertas/{{alertaId}}", "Sem autenticação.", [status(401)], auth="none"),
  req("CT44 - Excluir alerta como cidadão", "DELETE", "/api/alertas/{{alertaId}}", "Perfil sem permissão.", [status(403)], auth="cidadaoToken"),
  req("CT45 - Excluir alerta com token adulterado", "DELETE", "/api/alertas/{{alertaId}}",
      "Assinatura do JWT alterada: a validação de IssuerSigningKey deve rejeitar.",
      [status(401)], auth="tokenAdulterado",
      prereq=['const t = pm.collectionVariables.get("adminToken").split(".");',
              't[2] = t[2].split("").reverse().join("");',
              'pm.collectionVariables.set("tokenAdulterado", t.join("."));']),
  req("CT46 - Excluir alerta (admin)", "DELETE", "/api/alertas/{{alertaId}}", "Exclusão definitiva.", [status(204)], auth="adminToken"),
  req("CT47 - Excluir alerta já excluído", "DELETE", "/api/alertas/{{alertaId}}", "Idempotência: recurso não existe mais.",
      [status(404)], auth="adminToken"),
 ]),
 folder("06 - Limpeza", "Desativa os registros de teste para não poluir o painel.", [
  req("CT48 - Desativar sensor de teste", "PUT", "/api/sensores/{{novoSensorId}}", "ativo=false.",
      [status(200), 'pm.test("Sensor inativo", () => pm.expect(pm.response.json().ativo).to.eql(false));'],
      body=dict(sensor_valido, limitePerigo=55, ativo=False), auth="adminToken"),
  req("CT49 - Desativar região de teste", "PUT", "/api/regioes/{{novaRegiaoId}}", "ativo=false.",
      [status(200)], body={"nome": "QA Automatizado", "cidade": "Nova Serrana", "estado": "MG", "ativo": False}, auth="adminToken"),
 ]),
]

collection = {
 "info": {"_postman_id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "alertaja.fiap")),
          "name": "AlertaJá API - Global Solution 2026/2",
          "description": "Coleção completa da API AlertaJá (ASP.NET Core 10 + Oracle).\n\n"
                         "Execute em ordem (Run collection) — as requisições encadeiam variáveis "
                         "(tokens, ids criados). Variáveis: baseUrl, apiKey, adminSenha, cidadaoSenha.\n\n"
                         "Certificado local: em Settings desative 'SSL certificate verification' "
                         "ou confie no certificado com `dotnet dev-certs https --trust`.",
          "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
 "item": items,
 "variable": [
  {"key": "baseUrl", "value": "https://localhost:7275"},
  {"key": "apiKey", "value": "COLE_AQUI_O_VALOR_DE_ALERTAJA_API_KEY"},
  {"key": "adminSenha", "value": "admin123"},
  {"key": "cidadaoSenha", "value": "maria123"},
  {"key": "adminToken", "value": ""}, {"key": "cidadaoToken", "value": ""},
  {"key": "tokenAdulterado", "value": ""}, {"key": "sensorCodigo", "value": ""},
  {"key": "novaRegiaoId", "value": ""}, {"key": "novoSensorId", "value": ""},
  {"key": "medicaoId", "value": ""}, {"key": "alertaId", "value": ""},
 ],
}

out = sys.argv[1]
with open(out, "w", encoding="utf-8") as f:
    json.dump(collection, f, ensure_ascii=False, indent=2)
n = sum(len(x["item"]) for x in items)
print(f"{out}: {n} requisições")
