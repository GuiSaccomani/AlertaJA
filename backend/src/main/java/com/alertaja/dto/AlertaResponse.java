package com.alertaja.dto;

import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.StatusAlerta;
import com.alertaja.enums.TipoSensor;
import com.alertaja.model.Alerta;

import java.time.LocalDateTime;

public record AlertaResponse(
    Long id,
    Long regiaoId,
    String nomeRegiao,
    Long sensorId,
    String codigoSensor,
    TipoSensor tipoSensor,
    Long medicaoOrigemId,
    Long medicaoUltimaId,
    NivelRisco nivel,
    StatusAlerta status,
    String titulo,
    String descricao,
    Boolean ativo,
    LocalDateTime dataEmissao,
    LocalDateTime dataUltimaOcorrencia,
    LocalDateTime dataResolucao
) {
    public static AlertaResponse fromEntity(Alerta alerta) {
        return new AlertaResponse(
            alerta.getId(),
            alerta.getRegiao().getId(),
            alerta.getRegiao().getNome(),
            alerta.getSensor().getId(),
            alerta.getSensor().getCodigoIdentificador(),
            alerta.getSensor().getTipo(),
            alerta.getMedicaoOrigem().getId(),
            alerta.getMedicaoUltima() != null ? alerta.getMedicaoUltima().getId() : null,
            alerta.getNivel(),
            alerta.getStatus(),
            alerta.getTitulo(),
            alerta.getDescricao(),
            alerta.getAtivo(),
            alerta.getDataEmissao(),
            alerta.getDataUltimaOcorrencia(),
            alerta.getDataResolucao()
        );
    }
}
