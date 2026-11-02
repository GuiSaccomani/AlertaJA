package com.alertaja.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/medicoes")
@Tag(name = "Medições (Telemetria)", description = "Ingestão de dados de sensores protegida por chave de API")
public class MedicaoIngestionStubController {

    @PostMapping
    @Operation(
        summary = "Ingestão de Telemetria de Sensores",
        description = "Endpoint exclusivo para envio de leituras de sensores autenticados via cabeçalho X-Sensor-API-Key",
        security = @SecurityRequirement(name = "SensorApiKeyAuth")
    )
    public ResponseEntity<Map<String, String>> ingerirMedicao(@RequestBody(required = false) Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of(
            "status", "sucesso",
            "mensagem", "Telemetria autenticada com sucesso via X-Sensor-API-Key."
        ));
    }
}
