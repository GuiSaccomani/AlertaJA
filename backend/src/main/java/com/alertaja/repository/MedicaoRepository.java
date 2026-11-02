package com.alertaja.repository;

import com.alertaja.model.Medicao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MedicaoRepository extends JpaRepository<Medicao, Long> {

    Optional<Medicao> findTopBySensorIdOrderByDataHoraDesc(Long sensorId);

    Page<Medicao> findBySensorIdOrderByDataHoraDesc(Long sensorId, Pageable pageable);

    /**
     * Consulta paginada do histórico de medições com filtros dinâmicos opcionais:
     * sensorId, regiaoId e intervalo de datas (dataInicio e dataFim).
     */
    @Query("""
        SELECT m FROM Medicao m
        WHERE (:sensorId IS NULL OR m.sensor.id = :sensorId)
          AND (:regiaoId IS NULL OR m.sensor.regiao.id = :regiaoId)
          AND (:dataInicio IS NULL OR m.dataHora >= :dataInicio)
          AND (:dataFim IS NULL OR m.dataHora <= :dataFim)
        ORDER BY m.dataHora DESC
    """)
    Page<Medicao> findComFiltros(
        @Param("sensorId") Long sensorId,
        @Param("regiaoId") Long regiaoId,
        @Param("dataInicio") LocalDateTime dataInicio,
        @Param("dataFim") LocalDateTime dataFim,
        Pageable pageable
    );
}
