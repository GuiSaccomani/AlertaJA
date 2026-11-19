#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
AlertaJá - Simulador básico de telemetria IoT
Ambiente acadêmico: todos os dados são fictícios e destinados a testes.
Não representa previsões ou alertas oficiais da Defesa Civil.
"""

import argparse
import logging
import os
import sys
import time
from typing import Optional

import requests
from dotenv import load_dotenv
from pathlib import Path
from urllib3.exceptions import InsecureRequestWarning

# Carrega o .env localizado na raiz do projeto
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Pega a api key armazenada no .env
API_KEY = os.getenv("ALERTAJA_API_KEY")

if not API_KEY:
    raise RuntimeError("ALERTAJA_API_KEY não configurada.")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("AlertaJaSimulator")

API_BASE_URL = os.getenv("API_BASE_URL", "https://localhost:7275").rstrip("/")
SENSOR_PLUVIOMETRO_ID = os.getenv("SENSOR_PLUVIOMETRO_ID")
SENSOR_NIVEL_AGUA_ID = os.getenv("SENSOR_NIVEL_AGUA_ID")
SIMULATION_INTERVAL_SECONDS = float(
    os.getenv("SIMULATION_INTERVAL_SECONDS", "2.0")
)

# O certificado HTTPS de desenvolvimento do ASP.NET pode não ser confiável
# para o Python/requests. A verificação é desabilitada somente para localhost.
LOCAL_HTTPS = API_BASE_URL.lower().startswith(
    ("https://localhost", "https://127.0.0.1")
)
if LOCAL_HTTPS:
    requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)


class AlertaJaClient:
    """Cliente HTTP mínimo para a API C# do AlertaJá."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.verify = not LOCAL_HTTPS

    def enviar_medicao(self, sensor_id: str, valor: float) -> bool:
        """Envia uma medição para POST /api/medicoes."""
        url = f"{self.base_url}/api/medicoes"
        payload = {
            "sensorId": sensor_id,
            "valor": round(float(valor), 2),
        }

        try:
            logger.info("Enviando medição | Sensor: %s | Valor: %s",
                        sensor_id, payload["valor"])

            headers = {
                "X-API-Key": API_KEY
            }

            response = self.session.post(
                url,
                json=payload,
                headers=headers,
                timeout=10
            )

            if response.ok:
                logger.info("Medição enviada com sucesso (HTTP %d).",
                            response.status_code)
                if response.text:
                    logger.debug("Resposta da API: %s", response.text)
                return True

            logger.error("API respondeu HTTP %d: %s",
                         response.status_code, response.text)
            return False

        except requests.exceptions.SSLError as exc:
            logger.error(
                "Falha de certificado HTTPS. Confirme se a API está ativa "
                "em %s. Detalhes: %s", self.base_url, exc
            )
        except requests.exceptions.ConnectionError:
            logger.error(
                "Não foi possível conectar à API em %s. "
                "Confirme se o backend está em execução.", self.base_url
            )
        except requests.exceptions.Timeout:
            logger.error("A API demorou demais para responder.")
        except requests.exceptions.RequestException as exc:
            logger.error("Erro ao enviar medição: %s", exc)

        return False


# [CORREÇÃO QA] Valores alinhados aos limites cadastrados no banco:
#   Pluviômetro (mm):     atenção 10  | alerta 25  | perigo 50
#   Nível da água (cm):   atenção 100 | alerta 200 | perigo 300
# Antes, o nível do rio era enviado em metros (1.2 a 5.8) e nunca disparava
# alerta, e o cenário "atenção" enviava 28.5/32.0 (que já é faixa de ALERTA).

def executar_cenario_normal(client: AlertaJaClient):
    print("\n=== CENÁRIO: NORMAL ===", flush=True)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 5.0)
    time.sleep(1)
    client.enviar_medicao(SENSOR_NIVEL_AGUA_ID, 60.0)


def executar_cenario_atencao(client: AlertaJaClient):
    print("\n=== CENÁRIO: ATENÇÃO ===", flush=True)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 12.5)
    time.sleep(2)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 18.0)


def executar_cenario_alerta(client: AlertaJaClient):
    print("\n=== CENÁRIO: ALERTA ===", flush=True)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 32.0)
    time.sleep(1)
    client.enviar_medicao(SENSOR_NIVEL_AGUA_ID, 230.0)


def executar_cenario_perigo(client: AlertaJaClient):
    print("\n=== CENÁRIO: PERIGO ===", flush=True)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 72.5)
    time.sleep(1)
    client.enviar_medicao(SENSOR_NIVEL_AGUA_ID, 335.0)


def executar_cenario_recuperacao(client: AlertaJaClient):
    print("\n=== CENÁRIO: RECUPERAÇÃO ===", flush=True)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 18.0)
    time.sleep(2)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 4.0)
    time.sleep(1)
    client.enviar_medicao(SENSOR_NIVEL_AGUA_ID, 70.0)


def executar_cenario_multiplos(client: AlertaJaClient):
    print("\n=== CENÁRIO: MÚLTIPLOS SENSORES ===", flush=True)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 75.0)
    time.sleep(2)
    client.enviar_medicao(SENSOR_NIVEL_AGUA_ID, 310.0)
    time.sleep(2)
    client.enviar_medicao(SENSOR_PLUVIOMETRO_ID, 5.0)
    time.sleep(2)
    client.enviar_medicao(SENSOR_NIVEL_AGUA_ID, 55.0)


def executar_simulacao_continua(client: AlertaJaClient, intervalo: float):
    """Percorre uma curva simples de chuva e elevação do nível do rio."""
    padroes_chuva = [5.0, 8.0, 15.0, 26.0, 38.0, 52.0,
                     68.0, 62.0, 44.0, 22.0, 10.0, 3.0]
    padroes_rio = [60.0, 75.0, 110.0, 150.0, 210.0, 260.0,
                   320.0, 345.0, 280.0, 190.0, 120.0, 65.0]

    ciclo = 0
    print("\nSimulação contínua iniciada. Pressione Ctrl+C para parar.", flush=True)

    try:
        while True:
            indice = ciclo % len(padroes_chuva)

            logger.info("Ciclo %d", ciclo + 1)
            client.enviar_medicao(
                SENSOR_PLUVIOMETRO_ID, padroes_chuva[indice]
            )
            time.sleep(intervalo / 2)

            client.enviar_medicao(
                SENSOR_NIVEL_AGUA_ID, padroes_rio[indice]
            )
            time.sleep(intervalo / 2)

            ciclo += 1

    except KeyboardInterrupt:
        print("\nSimulação interrompida pelo usuário.")


def validar_configuracao():
    """Garante que os IDs obrigatórios foram definidos no .env."""
    faltantes = []

    if not SENSOR_PLUVIOMETRO_ID:
        faltantes.append("SENSOR_PLUVIOMETRO_ID")
    if not SENSOR_NIVEL_AGUA_ID:
        faltantes.append("SENSOR_NIVEL_AGUA_ID")

    if faltantes:
        logger.error(
            "Configure no arquivo .env as variáveis: %s",
            ", ".join(faltantes)
        )
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Simulador de sensores do AlertaJá"
    )
    parser.add_argument(
        "--url",
        default=API_BASE_URL,
        help="URL base da API (padrão: variável API_BASE_URL do .env)",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=SIMULATION_INTERVAL_SECONDS,
        help="Intervalo total entre ciclos da simulação contínua, em segundos",
    )
    parser.add_argument(
        "--scenario",
        choices=[
            "normal", "atencao", "alerta", "perigo",
            "recuperacao", "multiplos", "all",
        ],
        default="normal",
        help="Cenário a executar (padrão: normal)",
    )
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Executa a simulação contínua até Ctrl+C",
    )
    args = parser.parse_args()

    validar_configuracao()

    if args.interval <= 0:
        parser.error("--interval precisa ser maior que zero.")

    print("=" * 68, flush=True)
    print("ALERTAJÁ - SIMULADOR DE TELEMETRIA")
    print("Dados fictícios para testes acadêmicos.")
    print("Não representa alertas oficiais da Defesa Civil.")
    print("=" * 68, flush=True)

    client = AlertaJaClient(args.url)

    if LOCAL_HTTPS and args.url == API_BASE_URL:
        logger.warning(
            "Verificação do certificado HTTPS desabilitada apenas "
            "para o servidor local de desenvolvimento."
        )

    if args.continuous:
        executar_simulacao_continua(client, args.interval)
        return

    cenarios = {
        "normal": executar_cenario_normal,
        "atencao": executar_cenario_atencao,
        "alerta": executar_cenario_alerta,
        "perigo": executar_cenario_perigo,
        "recuperacao": executar_cenario_recuperacao,
        "multiplos": executar_cenario_multiplos,
    }

    if args.scenario == "all":
        for funcao in cenarios.values():
            funcao(client)
            time.sleep(1)
    else:
        cenarios[args.scenario](client)


if __name__ == "__main__":
    main()
