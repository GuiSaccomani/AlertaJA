package com.alertaja.dto;

import com.alertaja.enums.NivelRisco;
import com.alertaja.model.Regiao;

import java.time.LocalDateTime;

public record RegiaoResponse(
    Long id,
    String nome,
    String cidade,
    String estado,
    NivelRisco nivelRiscoAtual,
    Boolean ativo,
    LocalDateTime criadoEm,
    LocalDateTime atualizadoEm
) {
    public static RegiaoResponse fromEntity(Regiao regiao) {
        return new RegiaoResponse(
            regiao.getId(),
            regiao.getNome(),
            regiao.getCidade(),
            regiao.getEstado(),
            regiao.getNivelRiscoAtual(),
            regiao.getAtivo(),
            regiao.getCriadoEm(),
            regiao.getAtualizadoEm()
        );
    }
}
