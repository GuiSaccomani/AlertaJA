package com.alertaja.controller;

import com.alertaja.dto.MedicaoRequest;
import com.alertaja.dto.MedicaoResponse;
import com.alertaja.service.MedicaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/medicoes")
@Tag(name = "Medições e Telemetria", description = "Endpoints para ingestão de telemetria por sensores e consulta ao histórico")
public class MedicaoController {

    private final MedicaoService medicaoService;

    public MedicaoController(MedicaoService medicaoService) {
        this.medicaoService = medicaoService;
    }

    @PostMapping
    @Operation(
        summary = "Ingerir Medição (Telemetria de Sensor)",
        description = "Recebe e persiste uma nova leitura de sensor e processa o motor de alertas e recálculo regional de forma transacional atômica. " +
                      "Autenticação obrigatória via cabeçalho X-Sensor-API-Key.",
        security = @SecurityRequirement(name = "SensorApiKeyAuth")
    )
    public ResponseEntity<MedicaoResponse> ingerirMedicao(@Valid @RequestBody MedicaoRequest request) {
        MedicaoResponse response = medicaoService.registrarMedicao(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(
        summary = "Consultar Histórico de Medições",
        description = "Retorna o histórico paginado de medições com filtros dinâmicos por sensor, região e intervalo de datas.",
        security = @SecurityRequirement(name = "BearerAuth")
    )
    public ResponseEntity<Page<MedicaoResponse>> listar(
        @RequestParam(required = false) Long sensorId,
        @RequestParam(required = false) Long regiaoId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
        @PageableDefault(size = 20, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(medicaoService.listarComFiltros(sensorId, regiaoId, dataInicio, dataFim, pageable));
    }
}
