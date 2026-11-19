-- =============================================================================
-- ALERTAJÁ - CONSULTAS DE USO (SELECTs que simulam o uso real do sistema)
-- Banco: Oracle 19c | Execute após db_ddl.sql e db_dml.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- C1. PAINEL DE RISCO DA DEFESA CIVIL
-- Regiões ativas com quantidade de sensores ativos e de alertas em aberto,
-- ordenadas da mais crítica para a menos crítica.
-- (LEFT JOIN + COUNT DISTINCT + GROUP BY + CASE)
-- -----------------------------------------------------------------------------
SELECT r.nome || ' - ' || r.cidade || '/' || r.estado          AS regiao,
       r.nivel_risco_atual                                    AS nivel_risco,
       COUNT(DISTINCT CASE WHEN s.ativo = 1 THEN s.id END)    AS sensores_ativos,
       COUNT(DISTINCT CASE WHEN a.ativo = 1 THEN a.id END)    AS alertas_abertos
FROM regioes r
LEFT JOIN sensores s ON s.regiao_id = r.id
LEFT JOIN alertas  a ON a.regiao_id = r.id
WHERE r.ativo = 1
GROUP BY r.nome, r.cidade, r.estado, r.nivel_risco_atual
ORDER BY CASE r.nivel_risco_atual
           WHEN 'PERIGO'  THEN 1
           WHEN 'ALERTA'  THEN 2
           WHEN 'ATENCAO' THEN 3
           ELSE 4
         END,
         regiao;

-- -----------------------------------------------------------------------------
-- C2. ESTATÍSTICAS DE TELEMETRIA POR SENSOR
-- Total de leituras, mínimo, média e máximo de cada sensor, com a região.
-- (JOIN de 3 tabelas + COUNT/MIN/AVG/MAX)
-- -----------------------------------------------------------------------------
SELECT s.codigo_identificador                    AS sensor,
       s.tipo,
       r.nome || ' - ' || r.cidade               AS regiao,
       COUNT(m.id)                               AS total_leituras,
       MIN(m.valor)                              AS minimo,
       ROUND(AVG(m.valor), 2)                    AS media,
       MAX(m.valor)                              AS maximo,
       s.unidade_medida                          AS unidade
FROM sensores s
JOIN regioes  r ON r.id = s.regiao_id
LEFT JOIN medicoes m ON m.sensor_id = s.id
GROUP BY s.codigo_identificador, s.tipo, r.nome, r.cidade, s.unidade_medida
ORDER BY total_leituras DESC, sensor;

-- -----------------------------------------------------------------------------
-- C3. ALERTAS EM ABERTO COM A MEDIÇÃO QUE OS ORIGINOU E A MAIS RECENTE
-- Lista operacional para o atendente: onde, qual sensor, valor inicial e atual.
-- (JOIN de 4 tabelas, com MEDICOES usada duas vezes via alias)
-- -----------------------------------------------------------------------------
SELECT a.nivel,
       a.titulo,
       r.nome || ' - ' || r.cidade                         AS regiao,
       s.codigo_identificador                              AS sensor,
       mo.valor || ' ' || s.unidade_medida                 AS valor_origem,
       mu.valor || ' ' || s.unidade_medida                 AS valor_atual,
       TO_CHAR(a.data_emissao, 'DD/MM/YYYY HH24:MI')       AS emitido_em
FROM alertas a
JOIN regioes  r  ON r.id  = a.regiao_id
JOIN sensores s  ON s.id  = a.sensor_id
JOIN medicoes mo ON mo.id = a.medicao_origem_id
LEFT JOIN medicoes mu ON mu.id = a.medicao_ultima_id
WHERE a.ativo = 1
ORDER BY CASE a.nivel WHEN 'PERIGO' THEN 1 WHEN 'ALERTA' THEN 2 ELSE 3 END,
         a.data_emissao DESC;

-- -----------------------------------------------------------------------------
-- C4. DISTRIBUIÇÃO DOS ALERTAS POR NÍVEL E STATUS
-- Indicador de gestão: quantos alertas foram emitidos e como foram encerrados.
-- (GROUP BY com duas colunas + COUNT + percentual com função analítica)
-- -----------------------------------------------------------------------------
SELECT a.nivel,
       a.status,
       COUNT(*)                                                    AS quantidade,
       ROUND(100 * RATIO_TO_REPORT(COUNT(*)) OVER (), 1)           AS percentual
FROM alertas a
GROUP BY a.nivel, a.status
ORDER BY a.nivel, a.status;

-- -----------------------------------------------------------------------------
-- C5. SITUAÇÃO ATUAL DE CADA SENSOR (ÚLTIMA LEITURA x LIMITES)
-- Classifica a leitura mais recente de cada sensor ativo com a mesma regra
-- usada pela API (NORMAL / ATENCAO / ALERTA / PERIGO).
-- (Subconsulta com MAX + JOIN + CASE)
-- -----------------------------------------------------------------------------
SELECT s.codigo_identificador                      AS sensor,
       r.nome || ' - ' || r.cidade                 AS regiao,
       m.valor || ' ' || s.unidade_medida          AS ultima_leitura,
       TO_CHAR(m.data_hora, 'DD/MM/YYYY HH24:MI')  AS lida_em,
       CASE
         WHEN m.valor >= s.limite_perigo  THEN 'PERIGO'
         WHEN m.valor >= s.limite_alerta  THEN 'ALERTA'
         WHEN m.valor >= s.limite_atencao THEN 'ATENCAO'
         ELSE 'NORMAL'
       END                                         AS classificacao
FROM sensores s
JOIN regioes  r ON r.id = s.regiao_id
JOIN medicoes m ON m.sensor_id = s.id
WHERE s.ativo = 1
  AND m.data_hora = (SELECT MAX(m2.data_hora)
                       FROM medicoes m2
                      WHERE m2.sensor_id = s.id)
ORDER BY sensor;

-- -----------------------------------------------------------------------------
-- C6. TEMPO MÉDIO ATÉ A RESOLUÇÃO DOS ALERTAS, POR REGIÃO
-- Mede a duração dos eventos (emissão -> resolução) em horas.
-- (JOIN + AVG/MAX sobre diferença de datas + HAVING)
-- -----------------------------------------------------------------------------
SELECT r.nome || ' - ' || r.cidade                                         AS regiao,
       COUNT(a.id)                                                         AS alertas_resolvidos,
       ROUND(AVG((CAST(a.data_resolucao AS DATE)
                - CAST(a.data_emissao  AS DATE)) * 24), 2)                 AS horas_media,
       ROUND(MAX((CAST(a.data_resolucao AS DATE)
                - CAST(a.data_emissao  AS DATE)) * 24), 2)                 AS horas_maxima
FROM alertas a
JOIN regioes r ON r.id = a.regiao_id
WHERE a.data_resolucao IS NOT NULL
GROUP BY r.nome, r.cidade
HAVING COUNT(a.id) > 0
ORDER BY horas_media DESC;

-- -----------------------------------------------------------------------------
-- C7. SENSORES SEM COMUNICAÇÃO HÁ MAIS DE 24 HORAS
-- Detecta possíveis falhas de equipamento (sensor ativo que parou de enviar).
-- (LEFT JOIN + MAX + HAVING com condição sobre agregação)
-- -----------------------------------------------------------------------------
SELECT s.codigo_identificador                               AS sensor,
       r.nome || ' - ' || r.cidade                          AS regiao,
       TO_CHAR(MAX(m.data_hora), 'DD/MM/YYYY HH24:MI')      AS ultima_comunicacao,
       COUNT(m.id)                                          AS leituras_registradas
FROM sensores s
JOIN regioes  r ON r.id = s.regiao_id
LEFT JOIN medicoes m ON m.sensor_id = s.id
WHERE s.ativo = 1
GROUP BY s.codigo_identificador, r.nome, r.cidade
HAVING MAX(m.data_hora) IS NULL
    OR MAX(m.data_hora) < SYSTIMESTAMP - INTERVAL '1' DAY
ORDER BY MAX(m.data_hora) NULLS FIRST;
