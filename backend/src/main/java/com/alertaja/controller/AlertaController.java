package com.alertaja.controller;

import com.alertaja.dto.AlertaResponse;
import com.alertaja.enums.NivelRisco;
import com.alertaja.service.MotorAlertasService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/alertas")
@Tag(name = "Alertas de Risco", description = "Endpoints para consulta de alertas em tempo real, histórico e resolução administrativa")
@SecurityRequirement(name = "BearerAuth")
public class AlertaController {

    private final MotorAlertasService motorAlertasService;

    public AlertaController(MotorAlertasService motorAlertasService) {
        this.motorAlertasService = motorAlertasService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar Alerta por ID", description = "Retorna detalhes completos de um alerta e as medições vinculadas.")
    public ResponseEntity<AlertaResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(motorAlertasService.buscarPorId(id));
    }

    @GetMapping
    @Operation(
        summary = "Consultar Alertas",
        description = "Retorna lista paginada de alertas com filtros dinâmicos por região, sensor, nível de risco, status de ativação e datas."
    )
    public ResponseEntity<Page<AlertaResponse>> listar(
        @RequestParam(required = false) Long regiaoId,
        @RequestParam(required = false) Long sensorId,
        @RequestParam(required = false) NivelRisco nivel,
        @RequestParam(required = false) Boolean ativo,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
        @PageableDefault(size = 20, sort = "dataEmissao", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(motorAlertasService.listarComFiltros(
            regiaoId, sensorId, nivel, ativo, dataInicio, dataFim, pageable
        ));
    }

    @PatchMapping("/{id}/resolver")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Resolução Manual de Alerta",
        description = "Encerra manualmente um alerta ativo e recalcula o risco da região. Operação restrita a ROLE_ADMIN."
    )
    public ResponseEntity<AlertaResponse> resolverManualmente(@PathVariable Long id) {
        AlertaResponse response = motorAlertasService.resolverManualmente(id);
        return ResponseEntity.ok(response);
    }
}
