package com.alertaja.controller;

import com.alertaja.dto.SensorRequest;
import com.alertaja.dto.SensorResponse;
import com.alertaja.service.SensorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sensores")
@Tag(name = "Sensores de Monitoramento", description = "Endpoints para gerenciamento de sensores pluviométricos e de nível da água")
@SecurityRequirement(name = "BearerAuth")
public class SensorController {

    private final SensorService sensorService;

    public SensorController(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cadastrar Sensor", description = "Cadastra um novo sensor vinculado a uma região ativa e com limiares validados. Restrito a ROLE_ADMIN.")
    public ResponseEntity<SensorResponse> criar(@Valid @RequestBody SensorRequest request) {
        SensorResponse response = sensorService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar Sensor por ID", description = "Retorna os detalhes de um sensor específico.")
    public ResponseEntity<SensorResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(sensorService.buscarPorId(id));
    }

    @GetMapping
    @Operation(summary = "Listar Sensores", description = "Retorna lista paginada de sensores com filtros opcionais por região e status de ativação.")
    public ResponseEntity<Page<SensorResponse>> listar(
        @RequestParam(required = false) Long regiaoId,
        @RequestParam(required = false) Boolean ativo,
        @PageableDefault(size = 20, sort = "codigoIdentificador", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(sensorService.listar(regiaoId, ativo, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar Sensor", description = "Atualiza os dados e limiares de um sensor ativo. Restrito a ROLE_ADMIN.")
    public ResponseEntity<SensorResponse> atualizar(
        @PathVariable Long id,
        @Valid @RequestBody SensorRequest request
    ) {
        return ResponseEntity.ok(sensorService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desativar Sensor (Soft Delete)", description = "Desativa logicamente o sensor, preservando histórico de medições e alertas. Restrito a ROLE_ADMIN.")
    public ResponseEntity<Void> desativar(@PathVariable Long id) {
        sensorService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reativar Sensor", description = "Reativa um sensor previamente desativado (a região deve estar ativa). Restrito a ROLE_ADMIN.")
    public ResponseEntity<SensorResponse> reativar(@PathVariable Long id) {
        return ResponseEntity.ok(sensorService.reativar(id));
    }
}
