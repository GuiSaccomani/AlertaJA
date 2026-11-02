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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenService jwtTokenService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Deve registrar cidadão com senha criptografada via BCrypt e atribuir ROLE_CIDADAO")
    void deveRegistrarCidadaoComSucesso() {
        RegisterRequest request = new RegisterRequest("Carlos Oliveira", "carlos@alertaja.com", "senhaForte123");

        when(usuarioRepository.existsByEmail("carlos@alertaja.com")).thenReturn(false);
        when(passwordEncoder.encode("senhaForte123")).thenReturn("$2a$12$hashBCryptSeguroSimulado");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        UsuarioResponse response = authService.registrarCidadao(request);

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals("Carlos Oliveira", response.nome());
        assertEquals("carlos@alertaja.com", response.email());
        assertEquals(RoleUsuario.ROLE_CIDADAO, response.role());

        verify(passwordEncoder).encode("senhaForte123");
        verify(usuarioRepository).save(argThat(u -> 
            u.getRole() == RoleUsuario.ROLE_CIDADAO && 
            u.getSenha().equals("$2a$12$hashBCryptSeguroSimulado")
        ));
    }

    @Test
    @DisplayName("Deve lançar EmailJaCadastradoException quando e-mail já existir na base")
    void deveLancarExcecaoQuandoEmailDuplicado() {
        RegisterRequest request = new RegisterRequest("Ana", "ana@alertaja.com", "senha123");
        when(usuarioRepository.existsByEmail("ana@alertaja.com")).thenReturn(true);

        assertThrows(EmailJaCadastradoException.class, () -> authService.registrarCidadao(request));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve autenticar com sucesso e retornar token JWT")
    void deveAutenticarComSucesso() {
        LoginRequest request = new LoginRequest("ana@alertaja.com", "senhaCorreta");
        Usuario usuario = Usuario.builder()
                .id(1L)
                .nome("Ana")
                .email("ana@alertaja.com")
                .senha("$2a$12$hash")
                .role(RoleUsuario.ROLE_CIDADAO)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mock(UsernamePasswordAuthenticationToken.class));
        when(usuarioRepository.findByEmail("ana@alertaja.com")).thenReturn(Optional.of(usuario));
        when(jwtTokenService.gerarToken(1L, "ana@alertaja.com", "Ana", RoleUsuario.ROLE_CIDADAO))
                .thenReturn("mocked.jwt.token");

        AuthResponse response = authService.autenticar(request);

        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.token());
        assertEquals("Bearer", response.tipo());
        assertEquals(1L, response.id());
        assertEquals("Ana", response.nome());
        assertEquals(RoleUsuario.ROLE_CIDADAO, response.role());
    }

    @Test
    @DisplayName("Deve lançar BadCredentialsException quando as credenciais forem inválidas")
    void deveFalharLoginComCredenciaisInvalidas() {
        LoginRequest request = new LoginRequest("ana@alertaja.com", "senhaIncorreta");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Credenciais inválidas"));

        assertThrows(BadCredentialsException.class, () -> authService.autenticar(request));
        verify(jwtTokenService, never()).gerarToken(any(), any(), any(), any());
    }
}
