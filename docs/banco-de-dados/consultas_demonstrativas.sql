-- =============================================================================
-- ALERTAJÁ - CONSULTAS SQL DEMONSTRATIVAS COM JOIN E AGREGAÇÃO
-- Banco de Dados: PostgreSQL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONSULTA 1: Panorama Consolidado de Risco por Bacia Hidrográfica
-- Objetivo: Listar cada região com a contagem de sensores operantes, total de
-- alertas atualmente em aberto e seu nível de risco regional atual.
-- Recursos: LEFT JOIN duplo, COUNT condicional, GROUP BY, ORDER BY.
-- -----------------------------------------------------------------------------
SELECT 
    r.id AS regiao_id,
    r.nome AS regiao_nome,
    r.cidade || ' - ' || r.estado AS localizacao,
    r.nivel_risco_atual,
    COUNT(DISTINCT s.id) AS total_sensores_ativos,
    COUNT(DISTINCT CASE WHEN a.ativo = TRUE THEN a.id END) AS total_alertas_ativos
FROM regioes r
LEFT JOIN sensores s ON s.regiao_id = r.id AND s.ativo = TRUE
LEFT JOIN alertas a ON a.regiao_id = r.id AND a.ativo = TRUE
WHERE r.ativo = TRUE
GROUP BY r.id, r.nome, r.cidade, r.estado, r.nivel_risco_atual
ORDER BY 
    CASE r.nivel_risco_atual
        WHEN 'PERIGO' THEN 1
        WHEN 'ALERTA' THEN 2
        WHEN 'ATENCAO' THEN 3
        ELSE 4
    END,
    r.nome ASC;


-- -----------------------------------------------------------------------------
-- CONSULTA 2: Extrato Detalhado das Leituras Recentes com Cruzamento Regional
-- Objetivo: Rastrear as últimas 20 medições registradas via telemetria IoT,
-- exibindo os dados do sensor, a bacia correspondente e os limites de perigo.
-- Recursos: INNER JOIN triplo, ordenação temporal decrescente e formatação de datas.
-- -----------------------------------------------------------------------------
SELECT 
    m.id AS medicao_id,
    m.data_hora AS data_leitura,
    r.nome AS nome_regiao,
    s.codigo_identificador AS sensor_codigo,
    s.tipo AS tipo_sensor,
    m.valor AS valor_medido,
    s.unidade_medida,
    s.limite_atencao,
    s.limite_alerta,
    s.limite_perigo,
    CASE
        WHEN m.valor >= s.limite_perigo THEN 'PERIGO'
        WHEN m.valor >= s.limite_alerta THEN 'ALERTA'
        WHEN m.valor >= s.limite_atencao THEN 'ATENCAO'
        ELSE 'NORMAL'
    END AS risco_calculado
FROM medicoes m
INNER JOIN sensores s ON s.id = m.sensor_id
INNER JOIN regioes r ON r.id = s.regiao_id
ORDER BY m.data_hora DESC
LIMIT 20;


-- -----------------------------------------------------------------------------
-- CONSULTA 3: Auditoria e Rastreabilidade Completa dos Incidentes de Alerta
-- Objetivo: Demonstrar a rastreabilidade do ciclo de vida dos alertas, comparando
-- a medição que disparou o alerta original com a medição mais recente de reincidência.
-- Recursos: INNER JOIN com Regiões, Sensores e JOIN DUPLO na tabela de Medições
-- (para medicao_origem_id e medicao_ultima_id).
-- -----------------------------------------------------------------------------
SELECT 
    a.id AS alerta_id,
    r.nome AS regiao,
    s.codigo_identificador AS sensor,
    a.nivel AS nivel_alerta,
    a.status AS status_resolucao,
    m_origem.valor AS valor_disparo_inicial,
    m_origem.data_hora AS hora_disparo_inicial,
    COALESCE(m_ultima.valor, m_origem.valor) AS valor_ultima_reincidencia,
    COALESCE(m_ultima.data_hora, m_origem.data_hora) AS hora_ultima_reincidencia,
    a.data_resolucao,
    ROUND(
        EXTRACT(EPOCH FROM (COALESCE(a.data_resolucao, CURRENT_TIMESTAMP) - a.data_emissao)) / 60, 
        2
    ) AS duracao_em_minutos
FROM alertas a
INNER JOIN regioes r ON r.id = a.regiao_id
INNER JOIN sensores s ON s.id = a.sensor_id
INNER JOIN medicoes m_origem ON m_origem.id = a.medicao_origem_id
LEFT JOIN medicoes m_ultima ON m_ultima.id = a.medicao_ultima_id
ORDER BY a.data_emissao DESC;


-- -----------------------------------------------------------------------------
-- CONSULTA 4: Estatísticas de Telemetria por Tipo de Sensor e Região (Agregação com HAVING)
-- Objetivo: Analisar os volumes e picos hidrológicos médios e máximos registrados
-- por sensor em cada região monitorada, filtrando apenas sensores com histórico significativo.
-- Recursos: INNER JOIN, COUNT, AVG, MAX, MIN, GROUP BY e filtro HAVING.
-- -----------------------------------------------------------------------------
SELECT 
    r.nome AS regiao,
    s.codigo_identificador AS sensor_codigo,
    s.tipo AS tipo_sensor,
    s.unidade_medida,
    COUNT(m.id) AS total_amostras_coletadas,
    ROUND(AVG(m.valor), 2) AS valor_medio,
    MIN(m.valor) AS valor_minimo,
    MAX(m.valor) AS valor_pico_maximo,
    s.limite_perigo AS limite_critico_configurado
FROM sensores s
INNER JOIN regioes r ON r.id = s.regiao_id
INNER JOIN medicoes m ON m.sensor_id = s.id
GROUP BY r.nome, s.codigo_identificador, s.tipo, s.unidade_medida, s.limite_perigo
HAVING COUNT(m.id) >= 1
ORDER BY valor_pico_maximo DESC;


-- -----------------------------------------------------------------------------
-- CONSULTA 5: Eficiência e Resolução do Motor de Alertas
-- Objetivo: Medir a eficácia de encerramento dos incidentes, quantificando
-- quantos alertas foram encerrados automaticamente pelo motor de normalização
-- vs intervenções manuais da equipe de defesa civil e incidentes ainda pendentes.
-- Recursos: GROUP BY, COUNT condicional com FILTER/CASE e cálculo percentual.
-- -----------------------------------------------------------------------------
SELECT 
    r.nome AS regiao,
    COUNT(a.id) AS total_alertas_historico,
    COUNT(CASE WHEN a.status = 'ATIVO' THEN 1 END) AS alertas_em_aberto,
    COUNT(CASE WHEN a.status = 'RESOLVIDO_AUTO' THEN 1 END) AS auto_resolvidos_vazante,
    COUNT(CASE WHEN a.status = 'RESOLVIDO_MANUAL' THEN 1 END) AS resolvidos_manualmente,
    ROUND(
        (COUNT(CASE WHEN a.status IN ('RESOLVIDO_AUTO', 'RESOLVIDO_MANUAL') THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(a.id), 0)) * 100, 
        1
    ) AS taxa_resolucao_percentual
FROM regioes r
LEFT JOIN alertas a ON a.regiao_id = r.id
GROUP BY r.id, r.nome
ORDER BY total_alertas_historico DESC;
