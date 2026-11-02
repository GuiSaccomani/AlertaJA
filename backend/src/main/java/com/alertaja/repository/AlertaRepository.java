package com.alertaja.repository;

import com.alertaja.enums.NivelRisco;
import com.alertaja.model.Alerta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    /**
     * Busca o alerta atualmente ATIVO de um determinado sensor.
     * Utilizado pelo motor de alertas para atualização de ocorrência (anti-duplicação)
     * ou encerramento/escalonamento de risco.
     */
    Optional<Alerta> findFirstBySensorIdAndAtivoTrue(Long sensorId);

    List<Alerta> findBySensorIdAndAtivoTrue(Long sensorId);

    List<Alerta> findByRegiaoIdAndAtivoTrue(Long regiaoId);

    boolean existsByRegiaoIdAndAtivoTrue(Long regiaoId);

    boolean existsBySensorIdAndAtivoTrue(Long sensorId);

    /**
     * Consulta paginada do histórico de alertas com filtros dinâmicos opcionais:
     * regiaoId, sensorId, nivel, ativo e intervalo de datas (dataInicio e dataFim).
     */
    @Query("""
        SELECT a FROM Alerta a
        WHERE (:regiaoId IS NULL OR a.regiao.id = :regiaoId)
          AND (:sensorId IS NULL OR a.sensor.id = :sensorId)
          AND (:nivel IS NULL OR a.nivel = :nivel)
          AND (:ativo IS NULL OR a.ativo = :ativo)
          AND (:dataInicio IS NULL OR a.dataEmissao >= :dataInicio)
          AND (:dataFim IS NULL OR a.dataEmissao <= :dataFim)
        ORDER BY a.dataEmissao DESC
    """)
    Page<Alerta> findComFiltros(
        @Param("regiaoId") Long regiaoId,
        @Param("sensorId") Long sensorId,
        @Param("nivel") NivelRisco nivel,
        @Param("ativo") Boolean ativo,
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim,
        Pageable pageable
    );
}
