package com.alertaja.repository;

import com.alertaja.model.Sensor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, Long> {

    Optional<Sensor> findByCodigoIdentificador(String codigoIdentificador);

    Optional<Sensor> findByIdAndAtivoTrue(Long id);

    boolean existsByIdAndAtivoTrue(Long id);

    boolean existsByCodigoIdentificador(String codigoIdentificador);

    /**
     * Consulta todos os sensores ATIVOS pertencentes a uma região.
     * Utilizada fundamentalmente no recálculo de risco da região.
     */
    List<Sensor> findByRegiaoIdAndAtivoTrue(Long regiaoId);

    Page<Sensor> findByAtivoTrue(Pageable pageable);

    @Query("""
        SELECT s FROM Sensor s
        WHERE (:regiaoId IS NULL OR s.regiao.id = :regiaoId)
          AND (:ativo IS NULL OR s.ativo = :ativo)
    """)
    Page<Sensor> findComFiltros(
        @Param("regiaoId") Long regiaoId,
        @Param("ativo") Boolean ativo,
        Pageable pageable
    );
}
