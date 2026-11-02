package com.alertaja.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Administração (Protegido)", description = "Operações administrativas restritas a usuários ROLE_ADMIN")
public class AdminTestController {

    @GetMapping("/teste")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Verificação de Privilégio Administrativo",
        description = "Endpoint de controle de acesso restrito a ROLE_ADMIN",
        security = @SecurityRequirement(name = "BearerAuth")
    )
    public ResponseEntity<Map<String, String>> testeAcessoAdmin() {
        return ResponseEntity.ok(Map.of(
            "status", "autorizado",
            "mensagem", "Acesso administrativo concedido com sucesso."
        ));
    }
}
