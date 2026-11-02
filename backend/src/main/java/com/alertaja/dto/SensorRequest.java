package com.alertaja.dto;

import com.alertaja.enums.TipoSensor;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SensorRequest(
    @NotNull(message = "O ID da região é obrigatório")
    Long regiaoId,

    @NotBlank(message = "O código identificador é obrigatório")
    @Size(min = 2, max = 50, message = "O código identificador deve ter entre 2 e 50 caracteres")
    String codigoIdentificador,

    @NotNull(message = "O tipo do sensor é obrigatório (PLUVIOMETRO ou NIVEL_AGUA)")
    TipoSensor tipo,

    @NotBlank(message = "A unidade de medida é obrigatória (ex: mm, cm, m)")
    @Size(max = 10, message = "A unidade de medida não pode exceder 10 caracteres")
    String unidadeMedida,

    @NotNull(message = "O limite de atenção é obrigatório")
    @DecimalMin(value = "0.01", message = "O limite de atenção deve ser maior que zero")
    BigDecimal limiteAtencao,

    @NotNull(message = "O limite de alerta é obrigatório")
    @DecimalMin(value = "0.01", message = "O limite de alerta deve ser maior que zero")
    BigDecimal limiteAlerta,

    @NotNull(message = "O limite de perigo é obrigatório")
    @DecimalMin(value = "0.01", message = "O limite de perigo deve ser maior que zero")
    BigDecimal limitePerigo
) {}
