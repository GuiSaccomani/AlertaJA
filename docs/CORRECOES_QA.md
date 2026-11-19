# Correções realizadas a partir dos testes (QA — 19/11/2026)

A suíte Postman/Newman (`tests/AlertaJa.postman_collection.json`, 49 casos, 83 asserções) foi executada **duas vezes** contra a API real conectada ao Oracle da FIAP:

| Execução | Código | Casos aprovados | Asserções aprovadas |
| --- | --- | --- | --- |
| 1 | versão do commit `ae52d3e` (GitHub) | 45 / 49 | 79 / 83 |
| 2 | após as correções abaixo | **49 / 49** | **83 / 83** |
| 3 | após criar a camada Repository (item 14) | **49 / 49** | **83 / 83** |

Todas as alterações no código estão marcadas com o comentário `// [CORREÇÃO QA]`.

## Backend

| # | Teste que falhou | Problema | Correção | Arquivo |
| --- | --- | --- | --- | --- |
| 1 | CT14 — Criar região | `criadoEm` gravado como `0001-01-01` (o EF enviava o valor padrão de `DateTime` e o DEFAULT da coluna não era usado) | `CriadoEm = DateTime.Now` na criação | `Services/RegiaoService.cs` |
| 2 | CT15 — Atualizar região | Resposta do PUT não trazia `ativo` (sempre `false`, mesmo com a região ativa) | Campo `Ativo` incluído no DTO de resposta | `Services/RegiaoService.cs` |
| 3 | CT21 — Sensor com limites fora de ordem | `ArgumentException` do Service não era tratada → **HTTP 500** | `try/catch` no controller → **400** com `{ mensagem }` | `Controllers/SensoresController.cs` |
| 4 | CT23 — Sensor com código duplicado | Violação da UNIQUE `uk_sensores_codigo` no Oracle → **HTTP 500** | Verificação prévia no Service → **409 Conflict** (POST e PUT) | `Services/SensorService.cs`, `Controllers/SensoresController.cs` |
| 5 | (revisão de código) | `[Range(... "11" ...)]` em `LimiteAlerta` exigia mínimo 11 com mensagem "maior que 1" | Mínimo ajustado para 1 | `DTOs/Sensores/CriarSensorDto.cs` |

> **Lição aprendida:** a primeira versão da correção 4 usou `AnyAsync()`; o provedor Oracle gera `CASE WHEN ... THEN True ELSE False`, sintaxe aceita apenas no Oracle 23ai. No Oracle 19c da FIAP isso causa `ORA-00904: "FALSE": identificador inválido`. Foi trocado por `CountAsync(...) > 0`.

## Simulador IoT

| # | Problema encontrado ao executar `--scenario all` | Correção |
| --- | --- | --- |
| 6 | O sensor de nível recebia **1,2 a 5,8** (metros), mas os limites cadastrados são **100/200/300 cm** → **nunca gerava alerta** | Valores em centímetros (60 → 345 cm na curva contínua) |
| 7 | O cenário "atenção" enviava 28,5 e 32,0 mm, que já são faixa de **ALERTA** (≥ 25) | Atenção: 12,5 e 18 mm · Alerta: 32 mm + 230 cm · Perigo: 72,5 mm + 335 cm |
| 8 | `como_executar.txt` trazia `python simulate_sensors --scenario all` (sem `.py`) | Comandos corrigidos |

## Banco de dados

| # | Problema | Correção |
| --- | --- | --- |
| 9 | `db_dml.sql` tinha `'TROCAR_POR_HASH_BCRYPT'` no lugar das senhas: quem recriasse o banco não conseguiria logar | Hashes reais do `PasswordHasher` (admin123 / maria123 / joao123) |
| 10 | Inserts fixos no schema `"RM559009".` (falham em outro usuário Oracle) | Prefixo removido — o script roda em qualquer schema |
| 11 | Não havia consultas de uso (requisito "5+ SELECTs com JOIN e agregação") | `database/consultas.sql` com 7 consultas |

## Documentação

| # | Problema | Correção |
| --- | --- | --- |
| 12 | README dizia que a string de conexão fica em `appsettings.json`; na verdade fica em `appsettings.Development.json` (ignorado pelo Git) | README corrigido + `appsettings.Development.example.json` |
| 13 | Não havia Postman Collection (só a do Insomnia, com URLs fixas e tokens expirados) | Coleção Postman com variáveis, 49 casos e testes automáticos |

## Observações (não corrigidas — decisões de projeto para avaliar)

- Ao alterar os limites de um sensor, os alertas já abertos não são reavaliados (ex.: NIVEL-007 passou a 150/250/350, mas o alerta PERIGO de 322,5 cm continua aberto).
- Quando a leitura cai de PERIGO para ALERTA, o mesmo alerta é rebaixado; o pico não fica registrado no alerta (fica na tabela de medições).
- `GET /api/medicoes` e `GET /api/alertas` não têm paginação.
- Não existe endpoint para resolver um alerta manualmente (status `RESOLVIDO_MANUAL` existe no banco).

## Arquitetura — camada Repository explícita

| # | Situação anterior | Mudança | Arquivos |
| --- | --- | --- | --- |
| 14 | Os Services acessavam o `AppDbContext` diretamente (o EF Core fazia o papel de repositório) | Camada `Repositories/` com uma interface e uma implementação por entidade (`IUsuarioRepository`, `IRegiaoRepository`, `ISensorRepository`, `IMedicaoRepository`, `IAlertaRepository`) e um `IUnitOfWork`. Os Services passaram a depender só das interfaces; os Controllers não mudaram | `Repositories/Interfaces.cs`, `Repositories/Repositorios.cs`, `Services/*.cs`, `Program.cs` |

**Verificação:** a suíte completa foi executada de novo após a refatoração (execução 3, `tests/relatorios/run3`): **49/49 casos, 83/83 asserções**, e o simulador continuou levando a região de NORMAL a PERIGO e de volta a NORMAL.
