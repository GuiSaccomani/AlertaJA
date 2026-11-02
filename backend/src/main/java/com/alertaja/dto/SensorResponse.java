package com.alertaja.dto;

import com.alertaja.enums.TipoSensor;
import com.alertaja.model.Sensor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SensorResponse(
    Long id,
    Long regiaoId,
    String nomeRegiao,
    String codigoIdentificador,
    TipoSensor tipo,
    String unidadeMedida,
    BigDecimal limiteAtencao,
    BigDecimal limiteAlerta,
    BigDecimal limitePerigo,
    Boolean ativo,
    LocalDateTime ultimaLeitura,
    LocalDateTime criadoEm
) {
    public static SensorResponse fromEntity(Sensor sensor) {
        return new SensorResponse(
            sensor.getId(),
            sensor.getRegiao().getId(),
            sensor.getRegiao().getNome(),
            sensor.getCodigoIdentificador(),
            sensor.getTipo(),
            sensor.getUnidadeMedida(),
            sensor.getLimiteAtencao(),
            sensor.getLimiteAlerta(),
            sensor.getLimitePerigo(),
            sensor.getAtivo(),
            sensor.getUltimaLeitura(),
            sensor.getCriadoEm()
        );
    }
}
