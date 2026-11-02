package com.alertaja.security;

import com.alertaja.enums.RoleUsuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenServiceTest {

    private JwtTokenService jwtTokenService;
    private JwtProperties jwtProperties;

    // Chave de teste com 256 bits (32 bytes) para HMAC-SHA256
    private static final String CHAVE_TESTE = "ChaveSecretaSuperSeguraParaTestesAlertaJaComMaisDe256Bits123!";

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        ReflectionTestUtils.setField(jwtProperties, "secret", CHAVE_TESTE);
        ReflectionTestUtils.setField(jwtProperties, "expirationHours", 1L);

        jwtTokenService = new JwtTokenService(jwtProperties);
    }

    @Test
    @DisplayName("Deve gerar token JWT válido com claims de id, nome e role")
    void deveGerarTokenValido() {
        String token = jwtTokenService.gerarToken(1L, "cidadao@alertaja.com", "Maria Silva", RoleUsuario.ROLE_CIDADAO);

        assertNotNull(token);
        assertTrue(jwtTokenService.validarToken(token));
        assertEquals("cidadao@alertaja.com", jwtTokenService.obterEmailDoToken(token));
        assertEquals(RoleUsuario.ROLE_CIDADAO, jwtTokenService.obterRoleDoToken(token));
        assertEquals(1L, jwtTokenService.obterIdDoToken(token));
    }

    @Test
    @DisplayName("Deve rejeitar token JWT inválido ou adulterado")
    void deveRejeitarTokenInvalido() {
        assertFalse(jwtTokenService.validarToken("token.invalido.adulterado"));
        assertFalse(jwtTokenService.validarToken(""));
        assertFalse(jwtTokenService.validarToken(null));
    }

    @Test
    @DisplayName("Deve rejeitar token JWT quando expirado")
    void deveRejeitarTokenExpirado() {
        // Cria serviço com tempo de expiração zero (já nasce expirado)
        JwtProperties propExpirada = new JwtProperties();
        ReflectionTestUtils.setField(propExpirada, "secret", CHAVE_TESTE);
        ReflectionTestUtils.setField(propExpirada, "expirationHours", 0L);

        JwtTokenService serviceExpirado = new JwtTokenService(propExpirada);
        String token = serviceExpirado.gerarToken(2L, "expirado@alertaja.com", "Teste", RoleUsuario.ROLE_CIDADAO);

        assertFalse(serviceExpirado.validarToken(token));
    }
}
