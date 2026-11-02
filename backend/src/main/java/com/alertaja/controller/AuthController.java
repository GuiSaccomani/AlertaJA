package com.alertaja.controller;

import com.alertaja.dto.AuthResponse;
import com.alertaja.dto.LoginRequest;
import com.alertaja.dto.RegisterRequest;
import com.alertaja.dto.UsuarioResponse;
import com.alertaja.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticação", description = "Endpoints para cadastro de cidadãos, login e perfil do usuário autenticado")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Cadastro de Cidadão", description = "Registra um novo cidadão na plataforma AlertaJá (atribui ROLE_CIDADAO automaticamente)")
    public ResponseEntity<UsuarioResponse> register(@Valid @RequestBody RegisterRequest request) {
        UsuarioResponse response = authService.registrarCidadao(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login de Usuário", description = "Autentica cidadão ou administrador e retorna token JWT Bearer")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.autenticar(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(
        summary = "Dados do Usuário Autenticado",
        description = "Retorna os dados do cidadão ou administrador logado a partir do token Bearer JWT",
        security = @SecurityRequirement(name = "BearerAuth")
    )
    public ResponseEntity<UsuarioResponse> me() {
        UsuarioResponse response = authService.obterUsuarioAutenticado();
        return ResponseEntity.ok(response);
    }
}
