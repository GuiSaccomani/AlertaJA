package com.alertaja.dto;

import com.alertaja.enums.RoleUsuario;

public record AuthResponse(
    String token,
    String tipo,
    Long id,
    String nome,
    String email,
    RoleUsuario role
) {
    public AuthResponse(String token, Long id, String nome, String email, RoleUsuario role) {
        this(token, "Bearer", id, nome, email, role);
    }
}
