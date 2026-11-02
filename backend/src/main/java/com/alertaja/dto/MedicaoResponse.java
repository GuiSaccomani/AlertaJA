package com.alertaja.dto;

import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.TipoSensor;
import com.alertaja.model.Medicao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MedicaoResponse(
    Long id,
    Long sensorId,
    String codigoSensor,
    TipoSensor tipoSensor,
    Long regiaoId,
    String nomeRegiao,
    BigDecimal valor,
    String unidadeMedida,
    LocalDateTime dataHora,
    NivelRisco nivelRiscoDetectado,
    LocalDateTime criadoEm
) {
    public static MedicaoResponse fromEntity(Medicao medicao, NivelRisco nivelRiscoDetectado) {
        return new MedicaoResponse(
            medicao.getId(),
            medicao.getSensor().getId(),
            medicao.getSensor().getCodigoIdentificador(),
            medicao.getSensor().getTipo(),
            medicao.getSensor().getRegiao().getId(),
            medicao.getSensor().getRegiao().getNome(),
            medicao.getValor(),
            medicao.getSensor().getUnidadeMedida(),
            medicao.getDataHora(),
            nivelRiscoDetectado,
            medicao.getCriadoEm()
        );
    }
}
