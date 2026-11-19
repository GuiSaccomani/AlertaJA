# Simulador de Sensores IoT — AlertaJá

Representa dois sensores enviando leituras para a API por **HTTPS POST `/api/medicoes`** com o cabeçalho **`X-API-Key`**. Cada leitura aciona o motor de alertas da API.

| Sensor (padrão do `.env`) | Mede | Atenção | Alerta | Perigo |
| :--- | :--- | :--- | :--- | :--- |
| `SENSOR_PLUVIOMETRO_ID` — PLUV-001 | Chuva acumulada (mm) | 10 | 25 | 50 |
| `SENSOR_NIVEL_AGUA_ID` — NIVEL-001 | Nível do rio (cm) | 100 | 200 | 300 |

## Instalação

```powershell
pip install -r requirements.txt
```

O script lê o `.env` da **raiz** do projeto: `API_BASE_URL`, `ALERTAJA_API_KEY` (igual à do backend), `SENSOR_PLUVIOMETRO_ID`, `SENSOR_NIVEL_AGUA_ID` e `SIMULATION_INTERVAL_SECONDS`.

## Cenários

| Comando | Leituras enviadas | Resultado esperado |
| :--- | :--- | :--- |
| `python simulate_sensors.py` | 5 mm · 60 cm | Região NORMAL |
| `--scenario atencao` | 12,5 mm · 18 mm | Alerta ATENCAO |
| `--scenario alerta` | 32 mm · 230 cm | Alertas ALERTA |
| `--scenario perigo` | 72,5 mm · 335 cm | Alertas PERIGO, região PERIGO |
| `--scenario recuperacao` | 18 mm · 4 mm · 70 cm | Alertas resolvidos (RESOLVIDO_AUTO) |
| `--scenario multiplos` | 75 mm · 310 cm · 5 mm · 55 cm | Sobe para PERIGO e volta ao normal |
| `--scenario all` | todos acima, em sequência | — |
| `--continuous [--interval 2.0]` | curva de chuva (5→68 mm) e cheia do rio (60→345 cm) | Ciclo completo contínuo (Ctrl+C para parar) |

Opções: `--url` (sobrescreve `API_BASE_URL`) e `--interval` (segundos entre ciclos).

> A verificação do certificado HTTPS é desativada **apenas** para `https://localhost`, pois o certificado de desenvolvimento do ASP.NET Core pode não ser confiável para o Python.
