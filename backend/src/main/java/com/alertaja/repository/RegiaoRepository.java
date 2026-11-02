package com.alertaja.repository;

import com.alertaja.model.Regiao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegiaoRepository extends JpaRepository<Regiao, Long> {

    List<Regiao> findByAtivoTrue();

    Page<Regiao> findByAtivoTrue(Pageable pageable);

    Optional<Regiao> findByIdAndAtivoTrue(Long id);

    boolean existsByIdAndAtivoTrue(Long id);
}
