package com.alertaja.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MedicaoRequest(
    Long sensorId,

    String sensorCodigo,

    @NotNull(message = "O valor da medição é obrigatório")
    @DecimalMin(value = "0.00", message = "O valor da medição não pode ser negativo")
    BigDecimal valor,

    LocalDateTime dataHora
) {
    public MedicaoRequest(Long sensorId, BigDecimal valor, LocalDateTime dataHora) {
        this(sensorId, null, valor, dataHora);
    }
}
