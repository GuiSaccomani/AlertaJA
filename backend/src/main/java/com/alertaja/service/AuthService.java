package com.alertaja.service;

import com.alertaja.dto.AuthResponse;
import com.alertaja.dto.LoginRequest;
import com.alertaja.dto.RegisterRequest;
import com.alertaja.dto.UsuarioResponse;
import com.alertaja.enums.RoleUsuario;
import com.alertaja.exception.EmailJaCadastradoException;
import com.alertaja.model.Usuario;
import com.alertaja.repository.UsuarioRepository;
import com.alertaja.security.JwtTokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;

    public AuthService(
        UsuarioRepository usuarioRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtTokenService jwtTokenService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional
    public UsuarioResponse registrarCidadao(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new EmailJaCadastradoException(request.email());
        }

        // REGRA DE SEGURANÇA: Cadastro público SEMPRE atribui ROLE_CIDADAO.
        // Nunca permite que um usuário comum se auto-promova a ROLE_ADMIN.
        Usuario novoUsuario = Usuario.builder()
                .nome(request.nome().trim())
                .email(request.email().trim().toLowerCase())
                .senha(passwordEncoder.encode(request.senha()))
                .role(RoleUsuario.ROLE_CIDADAO)
                .build();

        Usuario salvo = usuarioRepository.save(novoUsuario);
        return UsuarioResponse.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public AuthResponse autenticar(LoginRequest request) {
        String emailNormalizado = request.email().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(emailNormalizado, request.senha())
        );

        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + emailNormalizado));

        String token = jwtTokenService.gerarToken(
            usuario.getId(),
            usuario.getEmail(),
            usuario.getNome(),
            usuario.getRole()
        );

        return new AuthResponse(
            token,
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getRole()
        );
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obterUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("Nenhum usuário autenticado no contexto de segurança");
        }

        String email = authentication.getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário autenticado não encontrado na base: " + email));

        return UsuarioResponse.fromEntity(usuario);
    }
}
