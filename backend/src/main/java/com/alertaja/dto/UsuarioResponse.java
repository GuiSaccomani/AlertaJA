package com.alertaja.dto;

import com.alertaja.enums.RoleUsuario;
import com.alertaja.model.Usuario;

import java.time.LocalDateTime;

public record UsuarioResponse(
    Long id,
    String nome,
    String email,
    RoleUsuario role,
    LocalDateTime criadoEm
) {
    public static UsuarioResponse fromEntity(Usuario usuario) {
        return new UsuarioResponse(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getRole(),
            usuario.getCriadoEm()
        );
    }
}
