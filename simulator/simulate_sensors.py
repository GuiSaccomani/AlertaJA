#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
 ALERTAJÁ - SIMULADOR DE TELEMETRIA IoT (AMBIENTE ACADÊMICO / SIMULADO)
================================================================================
 ATENÇÃO / AVISO LEGAL:
 Este módulo é destinado exclusivamente a testes acadêmicos e demonstração técnica.
 Todos os dados gerados são FICTÍCIOS e simulados por software.
 NÃO deve ser utilizado como ferramenta oficial de alerta ou previsão da Defesa Civil.
================================================================================
"""

import os
import sys
import time
import argparse
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

import requests
from dotenv import load_dotenv

# Carrega variáveis de ambiente de .env se existir
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# Configuração de Logging com formato legível
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("AlertaJaSimulator")

# Constantes de Sensores Padrão para a Simulação
SENSOR_PLUVIOMETRO = {
    "codigo": "PLUV-SUL-01",
    "tipo": "PLUVIOMETRO",
    "unidade": "mm/h",
    "limiteAtencao": 20.0,
    "limiteAlerta": 40.0,
    "limitePerigo": 60.0
}

SENSOR_NIVEL_AGUA = {
    "codigo": "NIVEL-RIO-01",
    "tipo": "NIVEL_AGUA",
    "unidade": "m",
    "limiteAtencao": 2.5,
    "limiteAlerta": 4.0,
    "limitePerigo": 5.5
}

REGIAO_SIMULACAO = {
    "nome": "Bacia Hidrográfica do Rio Tietê - Setor Sul",
    "descricao": "Região monitorada para simulação de risco hidrológico e contenção de enchentes",
    "cidade": "São Paulo",
    "estado": "SP"
}


def mascara_api_key(api_key: str) -> str:
    """Retorna a API key mascarada para não expor credenciais em logs."""
    if not api_key:
        return "[NÃO CONFIGURADA]"
    if len(api_key) <= 6:
        return "******"
    return f"{api_key[:3]}...{api_key[-3:]}"


class AlertaJaClient:
    """Cliente HTTP REST para interagir com a API do AlertaJá."""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.session = requests.Session()

    def enviar_medicao(self, sensor_codigo: str, valor: float, data_hora: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
        """
        Envia uma medição de telemetria para o endpoint POST /api/v1/medicoes
        utilizando o cabeçalho seguro X-Sensor-API-Key.
        """
        url = f"{self.base_url}/api/v1/medicoes"
        headers = {
            "Content-Type": "application/json",
            "X-Sensor-API-Key": self.api_key
        }

        iso_time = (data_hora or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%S")
        payload = {
            "sensorCodigo": sensor_codigo,
            "valor": round(float(valor), 2),
            "dataHora": iso_time
        }

        try:
            logger.info("-> [POST %s] Sensor: %s | Valor: %s | Data: %s (API Key: %s)",
                        url, sensor_codigo, valor, iso_time, mascara_api_key(self.api_key))
            response = self.session.post(url, json=payload, headers=headers, timeout=10)

            if response.status_code == 201:
                dados = response.json()
                logger.info("<- [HTTP 201 CREATED] Medição ID: %s | Sensor: %s (%s) | Nível Detectado: %s",
                            dados.get("id"), dados.get("codigoSensor"), dados.get("tipoSensor"), dados.get("nivelRiscoDetectado"))
                return dados
            else:
                logger.error("<- [HTTP %d %s] Falha no envio: %s",
                             response.status_code, response.reason, response.text)
                return None

        except requests.exceptions.ConnectionError:
            logger.error("Erro de Conexão: Não foi possível alcançar o servidor AlertaJá em '%s'. "
                         "Certifique-se de que o backend Spring Boot está em execução.", self.base_url)
            return None
        except requests.exceptions.Timeout:
            logger.error("Erro de Timeout ao conectar com '%s'. Servidor demorou para responder.", self.base_url)
            return None
        except Exception as e:
            logger.error("Erro inesperado durante o envio de telemetria: %s", str(e))
            return None

    def verificar_saude(self) -> bool:
        """Verifica se a API está online."""
        try:
            url = f"{self.base_url}/v3/api-docs"
            res = self.session.get(url, timeout=5)
            return res.status_code == 200
        except Exception:
            return False

    def autenticar_admin(self, email: str, senha: str) -> Optional[str]:
        """Realiza login como administrador e retorna o token JWT."""
        url = f"{self.base_url}/api/v1/auth/login"
        payload = {"email": email, "senha": senha}
        try:
            res = self.session.post(url, json=payload, timeout=5)
            if res.status_code == 200:
                return res.json().get("token")
        except Exception as e:
            logger.warning("Não foi possível autenticar como admin: %s", e)
        return None

    def cadastrar_usuario(self, nome: str, email: str, senha: str) -> bool:
        """Cadastra um usuário caso não exista."""
        url = f"{self.base_url}/api/v1/auth/register"
        payload = {"nome": nome, "email": email, "senha": senha}
        try:
            res = self.session.post(url, json=payload, timeout=5)
            return res.status_code == 201 or res.status_code == 409
        except Exception:
            return False

    def bootstrap_ambiente(self, admin_email: str, admin_senha: str) -> bool:
        """
        Cria a região e os sensores de teste via API caso ainda não estejam criados no banco.
        Garante que o simulador possa ser executado de forma totalmente autônoma.
        """
        logger.info("=== INICIANDO BOOTSTRAP DO AMBIENTE DE SIMULAÇÃO ===")
        # Tenta cadastrar admin ou logar
        self.cadastrar_usuario("Administrador do Sistema", admin_email, admin_senha)
        token = self.autenticar_admin(admin_email, admin_senha)

        if not token:
            logger.warning("Aviso: Não foi possível obter token de admin para criar automaticamente sensores via API.")
            logger.info("Se os sensores já foram previamente cadastrados no banco, a simulação continuará normalmente.")
            return False

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 1. Obter ou Criar Região
        regiao_id = None
        try:
            res_regioes = self.session.get(f"{self.base_url}/api/v1/regioes?nome={REGIAO_SIMULACAO['nome']}", headers=headers)
            if res_regioes.status_code == 200:
                conteudo = res_regioes.json().get("content", [])
                for r in conteudo:
                    if r.get("nome") == REGIAO_SIMULACAO["nome"]:
                        regiao_id = r.get("id")
                        logger.info("Região já existente encontrada: ID %s - %s", regiao_id, r.get("nome"))
                        break

            if not regiao_id:
                res_cria_reg = self.session.post(f"{self.base_url}/api/v1/regioes", json=REGIAO_SIMULACAO, headers=headers)
                if res_cria_reg.status_code == 201:
                    regiao_id = res_cria_reg.json().get("id")
                    logger.info("Região criada com sucesso: ID %s", regiao_id)
        except Exception as e:
            logger.error("Erro ao verificar/criar região: %s", e)
            return False

        # 2. Obter ou Criar Sensores
        for sensor_info in [SENSOR_PLUVIOMETRO, SENSOR_NIVEL_AGUA]:
            try:
                res_sensores = self.session.get(f"{self.base_url}/api/v1/sensores", headers=headers)
                sensor_existente = False
                if res_sensores.status_code == 200:
                    for s in res_sensores.json().get("content", []):
                        if s.get("codigoIdentificador") == sensor_info["codigo"]:
                            sensor_existente = True
                            logger.info("Sensor já existente encontrado: %s (ID %s)", sensor_info["codigo"], s.get("id"))
                            break

                if not sensor_existente and regiao_id:
                    payload_sensor = {
                        "codigoIdentificador": sensor_info["codigo"],
                        "tipo": sensor_info["tipo"],
                        "regiaoId": regiao_id,
                        "unidadeMedida": sensor_info["unidade"],
                        "limiteAtencao": sensor_info["limiteAtencao"],
                        "limiteAlerta": sensor_info["limiteAlerta"],
                        "limitePerigo": sensor_info["limitePerigo"]
                    }
                    res_cria_sensor = self.session.post(f"{self.base_url}/api/v1/sensores", json=payload_sensor, headers=headers)
                    if res_cria_sensor.status_code == 201:
                        logger.info("Sensor criado com sucesso: %s (ID %s)", sensor_info["codigo"], res_cria_sensor.json().get("id"))
            except Exception as e:
                logger.error("Erro ao verificar/criar sensor %s: %s", sensor_info["codigo"], e)

        logger.info("=== BOOTSTRAP DO AMBIENTE CONCLUÍDO COM SUCESSO ===")
        return True

    def consultar_alertas_ativos(self, token_auth: Optional[str] = None) -> List[Dict[str, Any]]:
        """Consulta os alertas com status ATIVO na API."""
        if not token_auth:
            return []
        url = f"{self.base_url}/api/v1/alertas?ativo=true"
        headers = {"Authorization": f"Bearer {token_auth}"}
        try:
            res = self.session.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                return res.json().get("content", [])
        except Exception:
            pass
        return []

    def consultar_regiao(self, regiao_id: int, token_auth: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Consulta o estado e risco atual de uma região."""
        if not token_auth:
            return None
        url = f"{self.base_url}/api/v1/regioes/{regiao_id}"
        headers = {"Authorization": f"Bearer {token_auth}"}
        try:
            res = self.session.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass
        return None


# ==============================================================================
# CENÁRIOS CONTROLADOS DE SIMULAÇÃO
# ==============================================================================

def executar_cenario_normal(client: AlertaJaClient):
    """Cenário 1: Medições abaixo do limite de atenção (Risco NORMAL)."""
    print("\n" + "="*80)
    print(" CENÁRIO 1: SITUAÇÃO DE NORMALIDADE (RISCO NORMAL)")
    print(" Leituras: Pluviômetro = 5.0 mm/h (Limite Atenção = 20.0)")
    print("           Nível da Água = 1.2 m   (Limite Atenção = 2.5)")
    print(" Esperado: Nível NORMAL, nenhum alerta aberto, região em NORMAL.")
    print("="*80)
    time.sleep(1)

    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 5.0)
    time.sleep(1)
    client.enviar_medicao(SENSOR_NIVEL_AGUA["codigo"], 1.2)


def executar_cenario_atencao(client: AlertaJaClient):
    """Cenário 2: Medições acima do limite de atenção e teste de anti-duplicação."""
    print("\n" + "="*80)
    print(" CENÁRIO 2: ENTRADA EM ATENÇÃO E ANTI-DUPLICAÇÃO")
    print(" Leituras: Pluviômetro = 28.5 mm/h (Limite Atenção = 20.0)")
    print("           Segunda leitura no mesmo nível = 32.0 mm/h")
    print(" Esperado: Criação de alerta ATENCAO na primeira medição.")
    print("           Na segunda medição: atualização da última ocorrência SEM duplicar alerta.")
    print("="*80)
    time.sleep(1)

    print("\n[Passo 2.1] Enviando leitura que atinge ATENÇÃO...")
    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 28.5)

    time.sleep(2)
    print("\n[Passo 2.2] Enviando leitura contínua no mesmo nível de ATENÇÃO (Anti-duplicação)...")
    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 32.0)


def executar_cenario_alerta(client: AlertaJaClient):
    """Cenário 3: Escalonamento de ATENÇÃO para ALERTA."""
    print("\n" + "="*80)
    print(" CENÁRIO 3: ESCALONAMENTO PARA NÍVEL 'ALERTA'")
    print(" Leituras: Pluviômetro = 48.0 mm/h (Limite Alerta = 40.0)")
    print(" Esperado: Alerta anterior de ATENÇÃO é resolvido com 'RESOLVIDO_AUTO'.")
    print("           Novo alerta criado com nível 'ALERTA'. Região passa para ALERTA.")
    print("="*80)
    time.sleep(1)

    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 48.0)


def executar_cenario_perigo(client: AlertaJaClient):
    """Cenário 4: Escalonamento para Nível Máximo (PERIGO)."""
    print("\n" + "="*80)
    print(" CENÁRIO 4: ESCALONAMENTO PARA NÍVEL MÁXIMO 'PERIGO'")
    print(" Leituras: Pluviômetro = 72.5 mm/h (Limite Perigo = 60.0)")
    print(" Esperado: Alerta anterior de ALERTA é resolvido.")
    print("           Novo alerta criado com nível 'PERIGO'. Risco regional passa para PERIGO.")
    print("="*80)
    time.sleep(1)

    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 72.5)


def executar_cenario_recuperacao(client: AlertaJaClient):
    """Cenário 5: Desescalonamento e auto-resolução de alertas."""
    print("\n" + "="*80)
    print(" CENÁRIO 5: RECUPERAÇÃO GRADUAL E RESOLUÇÃO AUTOMÁTICA")
    print(" Leituras: Redução das chuvas de 72.5 mm/h -> 25.0 mm/h -> 4.0 mm/h (NORMAL)")
    print(" Esperado: Ao cair para 25.0 mm/h (ATENCAO), alerta de PERIGO é finalizado e")
    print("           cria-se alerta proporcional de ATENÇÃO.")
    print("           Ao retornar para 4.0 mm/h (NORMAL), todos os alertas são")
    print("           resolvidos automaticamente e a região volta a NORMAL.")
    print("="*80)
    time.sleep(1)

    print("\n[Passo 5.1] Redução da intensidade das chuvas para ATENÇÃO (25.0 mm/h)...")
    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 25.0)

    time.sleep(2)
    print("\n[Passo 5.2] Fim das chuvas. Retorno completo à NORMALIDADE (4.0 mm/h)...")
    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 4.0)


def executar_cenario_multiplos(client: AlertaJaClient):
    """
    Cenário 6: Múltiplos sensores na mesma região demonstrando a integridade
    do recálculo regional.
    """
    print("\n" + "="*80)
    print(" CENÁRIO 6: MULTI-SENSORES E INTEGRIDADE DO RISCO REGIONAL")
    print(" Sensores: Pluviômetro (PLUV-SUL-01) e Sensor de Nível do Rio (NIVEL-RIO-01)")
    print(" Dinâmica:")
    print("  1. Pluviômetro entra em PERIGO (75.0 mm/h)")
    print("  2. Nível do Rio sobe para ATENÇÃO (3.0 m)")
    print("     => Região deve assumir PERIGO (maior risco entre os sensores)")
    print("  3. Chuva cessa: Pluviômetro volta para NORMAL (5.0 mm/h)")
    print("     => CRÍTICO: Região NÃO PODE voltar a NORMAL! Deve assumir ATENÇÃO,")
    print("        pois o rio ainda está em situação de risco.")
    print("  4. Rio drena: Nível do Rio volta para NORMAL (1.1 m)")
    print("     => Agora sim a região retorna a NORMAL!")
    print("="*80)
    time.sleep(1)

    print("\n[Passo 6.1] Pluviômetro entra em PERIGO (75.0 mm/h)...")
    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 75.0)

    time.sleep(2)
    print("\n[Passo 6.2] Nível do Rio entra em ATENÇÃO (3.0 m)...")
    client.enviar_medicao(SENSOR_NIVEL_AGUA["codigo"], 3.0)

    time.sleep(2)
    print("\n[Passo 6.3] Chuva cessa (Pluviômetro volta para 5.0 mm/h - NORMAL)...")
    print("           (Verificando preservação do risco regional em ATENÇÃO)")
    client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], 5.0)

    time.sleep(2)
    print("\n[Passo 6.4] Rio drena completamente (Nível da Água volta para 1.1 m - NORMAL)...")
    print("           (Verificando retorno da região para NORMAL)")
    client.enviar_medicao(SENSOR_NIVEL_AGUA["codigo"], 1.1)


def executar_simulacao_continua(client: AlertaJaClient, intervalo: float):
    """
    Simulação contínua com oscilação climática gradual em loop.
    Permite interrupção limpa via Ctrl+C.
    """
    print("\n" + "="*80)
    print(" INICIANDO MODO DE SIMULAÇÃO CONTÍNUA")
    print(f" Intervalo entre medições: {intervalo} segundos")
    print(" Pressione Ctrl+C a qualquer momento para interromper graciosamente.")
    print("="*80)

    # Curva simplificada de evento meteorológico (chuva e resposta do nível do rio)
    padroes_chuva = [5.0, 8.0, 15.0, 26.0, 38.0, 52.0, 68.0, 62.0, 44.0, 22.0, 10.0, 3.0]
    padroes_rio   = [1.2, 1.4,  1.8,  2.2,  2.8,  3.7,  4.8,  5.8,  5.2,  3.9,  2.6, 1.3]

    ciclo = 0
    try:
        while True:
            idx = ciclo % len(padroes_chuva)
            valor_chuva = padroes_chuva[idx]
            valor_rio = padroes_rio[idx]

            logger.info("--- Ciclo de Simulação #%d (Tempo Climático: Passo %d/%d) ---", ciclo + 1, idx + 1, len(padroes_chuva))
            client.enviar_medicao(SENSOR_PLUVIOMETRO["codigo"], valor_chuva)
            time.sleep(intervalo / 2.0)

            client.enviar_medicao(SENSOR_NIVEL_AGUA["codigo"], valor_rio)
            time.sleep(intervalo / 2.0)

            ciclo += 1
    except KeyboardInterrupt:
        print("\n" + "-"*80)
        logger.info("Simulação contínua interrompida pelo usuário via teclado (Ctrl+C).")
        logger.info("Processo finalizado de forma limpa e segura.")
        print("-"*80)
        sys.exit(0)


# ==============================================================================
# PONTO DE ENTRADA (CLI)
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="AlertaJá - Simulador de Sensores IoT de Risco de Alagamento (Ambiente Acadêmico)"
    )
    parser.add_argument("--url", default=os.getenv("API_BASE_URL", "http://localhost:8080"),
                        help="URL base da API (padrão: http://localhost:8080)")
    parser.add_argument("--api-key", default=os.getenv("SENSOR_INGESTION_API_KEY"),
                        help="Chave de telemetria (X-Sensor-API-Key). Se omitido, busca no ambiente.")
    parser.add_argument("--interval", type=float,
                        default=float(os.getenv("SIMULATION_INTERVAL_SECONDS", "2.0")),
                        help="Intervalo em segundos entre medições na simulação contínua")
    parser.add_argument("--scenario",
                        choices=["normal", "atencao", "alerta", "perigo", "recuperacao", "multiplos", "all"],
                        help="Executa um cenário de teste controlado específico")
    parser.add_argument("--continuous", action="store_true",
                        help="Executa a simulação contínua em loop até ser interrompida por Ctrl+C")
    parser.add_argument("--bootstrap", action="store_true",
                        help="Cria automaticamente a região e os sensores no banco via API se não existirem")

    args = parser.parse_args()

    # Banner Institucional / Acadêmico Obrigatório
    print("=" * 80)
    print(" ALERTAJÁ - SISTEMA DE MONITORAMENTO DE RISCOS DE ALAGAMENTO")
    print(" SIMULADOR DE SENSORES IoT (TELEMETRIA FICTÍCIA / AMBIENTE EDUCACIONAL)")
    print(" AVISO: Dados exclusivamente para validação de regras de negócio de software.")
    print(" NÃO substitui nem representa previsões oficiais da Defesa Civil.")
    print("=" * 80)

    # Validação rigorosa da Chave de Ingestão
    api_key = args.api_key
    if not api_key:
        logger.critical(
            "ERRO DE CONFIGURAÇÃO: A chave de telemetria 'SENSOR_INGESTION_API_KEY' não foi informada!\n"
            "Defina-a no arquivo 'simulator/.env' ou passe via flag '--api-key <chave>'.\n"
            "Exemplo:\n"
            "  SENSOR_INGESTION_API_KEY=sua-chave-secreta-aqui\n"
        )
        sys.exit(1)

    client = AlertaJaClient(base_url=args.url, api_key=api_key)

    # Teste de conectividade com o backend
    if not client.verificar_saude():
        logger.warning(
            "Aviso: Não foi possível obter confirmação de saúde de '%s'.\n"
            "Verifique se o backend Spring Boot já está ativo e rodando.",
            args.url
        )

    # Executa bootstrap se solicitado
    if args.bootstrap:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@alertaja.com")
        admin_senha = os.getenv("ADMIN_PASSWORD", "Admin@123456")
        client.bootstrap_ambiente(admin_email, admin_senha)

    # Execução de Cenários
    if args.scenario:
        cenarios = {
            "normal": [executar_cenario_normal],
            "atencao": [executar_cenario_atencao],
            "alerta": [executar_cenario_alerta],
            "perigo": [executar_cenario_perigo],
            "recuperacao": [executar_cenario_recuperacao],
            "multiplos": [executar_cenario_multiplos],
            "all": [
                executar_cenario_normal,
                executar_cenario_atencao,
                executar_cenario_alerta,
                executar_cenario_perigo,
                executar_cenario_recuperacao,
                executar_cenario_multiplos
            ]
        }

        for func in cenarios[args.scenario]:
            func(client)
            time.sleep(1)

        print("\n" + "="*80)
        logger.info("Execução do cenário '%s' finalizada com sucesso!", args.scenario)
        print("="*80)

    elif args.continuous:
        executar_simulacao_continua(client, args.interval)
    else:
        # Se nenhuma opção for passada, executa a bateria completa de cenários
        logger.info("Nenhum cenário específico informado. Executando bateria completa (--scenario all)...")
        cenarios = [
            executar_cenario_normal,
            executar_cenario_atencao,
            executar_cenario_alerta,
            executar_cenario_perigo,
            executar_cenario_recuperacao,
            executar_cenario_multiplos
        ]
        for func in cenarios:
            func(client)
            time.sleep(1)

        print("\n" + "="*80)
        logger.info("Bateria de cenários do AlertaJá executada com sucesso!")
        print("="*80)


if __name__ == "__main__":
    main()
