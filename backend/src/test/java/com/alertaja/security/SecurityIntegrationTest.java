package com.alertaja.security;

import com.alertaja.dto.LoginRequest;
import com.alertaja.dto.RegisterRequest;
import com.alertaja.enums.RoleUsuario;
import com.alertaja.model.Usuario;
import com.alertaja.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private static final String SENSOR_API_KEY_VALIDA = "test-sensor-ingestion-api-key-test-only";

    private Usuario admin;
    private Usuario cidadao;
    private String tokenAdmin;
    private String tokenCidadao;

    @BeforeEach
    void setUp() {
        admin = usuarioRepository.save(Usuario.builder()
                .nome("Administrador Sistema")
                .email("admin@alertaja.com")
                .senha(passwordEncoder.encode("admin123456"))
                .role(RoleUsuario.ROLE_ADMIN)
                .build());

        cidadao = usuarioRepository.save(Usuario.builder()
                .nome("Cidadão Comum")
                .email("cidadao.comum@alertaja.com")
                .senha(passwordEncoder.encode("cidadao123456"))
                .role(RoleUsuario.ROLE_CIDADAO)
                .build());

        tokenAdmin = jwtTokenService.gerarToken(admin.getId(), admin.getEmail(), admin.getNome(), admin.getRole());
        tokenCidadao = jwtTokenService.gerarToken(cidadao.getId(), cidadao.getEmail(), cidadao.getNome(), cidadao.getRole());
    }

    @Test
    @DisplayName("Deve cadastrar cidadão com sucesso e verificar senha com hash BCrypt no banco")
    void deveCadastrarCidadaoComBCrypt() throws Exception {
        RegisterRequest request = new RegisterRequest("Novo Cidadão", "novo.cidadao@alertaja.com", "senhaForte@2026");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.nome").value("Novo Cidadão"))
                .andExpect(jsonPath("$.email").value("novo.cidadao@alertaja.com"))
                .andExpect(jsonPath("$.role").value("ROLE_CIDADAO"))
                .andExpect(jsonPath("$.senha").doesNotExist()); // Nunca expor a senha

        Usuario salvo = usuarioRepository.findByEmail("novo.cidadao@alertaja.com").orElseThrow();
        assertNotEquals("senhaForte@2026", salvo.getSenha(), "A senha nunca pode ser persistida em texto puro");
        assertTrue(salvo.getSenha().startsWith("$2a$"), "A senha deve estar armazenada com hash BCrypt");
        assertTrue(passwordEncoder.matches("senhaForte@2026", salvo.getSenha()));
        assertEquals(RoleUsuario.ROLE_CIDADAO, salvo.getRole());
    }

    @Test
    @DisplayName("Deve rejeitar cadastro com e-mail duplicado retornando 409 Conflict")
    void deveRejeitarEmailDuplicado() throws Exception {
        RegisterRequest request = new RegisterRequest("Tentativa Duplicada", "admin@alertaja.com", "qualquerSenha123");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflito de Dados"));
    }

    @Test
    @DisplayName("Deve realizar login com credenciais válidas e retornar token JWT")
    void deveFazerLoginValido() throws Exception {
        LoginRequest request = new LoginRequest("admin@alertaja.com", "admin123456");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.email").value("admin@alertaja.com"))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String tokenGerado = responseNode.get("token").asText();
        assertTrue(jwtTokenService.validarToken(tokenGerado));
    }

    @Test
    @DisplayName("Deve rejeitar login com senha incorreta retornando 401 Unauthorized")
    void deveRejeitarLoginInvalido() throws Exception {
        LoginRequest request = new LoginRequest("admin@alertaja.com", "senhaIncorretaErrada");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Credenciais Inválidas"));
    }

    @Test
    @DisplayName("Deve retornar os dados do perfil autenticado em GET /api/v1/auth/me")
    void deveRetornarDadosUsuarioAutenticado() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + tokenCidadao))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(cidadao.getId()))
                .andExpect(jsonPath("$.email").value("cidadao.comum@alertaja.com"))
                .andExpect(jsonPath("$.role").value("ROLE_CIDADAO"));
    }

    @Test
    @DisplayName("Deve rejeitar acesso ao endpoint /me sem token com 401 Unauthorized")
    void deveRejeitarMeSemToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Deve rejeitar acesso ao endpoint /me com token inválido com 401 Unauthorized")
    void deveRejeitarMeComTokenInvalido() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer token_completamente_invalido_12345"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Deve permitir acesso à rota administrativa para usuário com ROLE_ADMIN")
    void devePermitirAcessoAdminParaAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/teste")
                .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("autorizado"));
    }

    @Test
    @DisplayName("Deve proibir acesso à rota administrativa para usuário com ROLE_CIDADAO retornando 403 Forbidden")
    void deveProibirAcessoAdminParaCidadao() throws Exception {
        mockMvc.perform(get("/api/v1/admin/teste")
                .header("Authorization", "Bearer " + tokenCidadao))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Acesso Proibido"));
    }

    @Test
    @DisplayName("Deve permitir ingestão de telemetria quando o cabeçalho X-Sensor-API-Key for válido")
    void devePermitirIngestaoComApiKeyValida() throws Exception {
        mockMvc.perform(post("/api/v1/medicoes")
                .header("X-Sensor-API-Key", SENSOR_API_KEY_VALIDA)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sensorId\": 1, \"valor\": 45.2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("sucesso"));
    }

    @Test
    @DisplayName("Deve rejeitar ingestão de telemetria com chave X-Sensor-API-Key inválida retornando 401")
    void deveRejeitarIngestaoComApiKeyInvalida() throws Exception {
        mockMvc.perform(post("/api/v1/medicoes")
                .header("X-Sensor-API-Key", "chave-totalmente-errada-999")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sensorId\": 1, \"valor\": 45.2}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Autenticação de telemetria falhou: cabeçalho 'X-Sensor-API-Key' ausente ou inválido."));
    }

    @Test
    @DisplayName("Deve rejeitar ingestão de telemetria sem o cabeçalho X-Sensor-API-Key retornando 401")
    void deveRejeitarIngestaoSemApiKey() throws Exception {
        mockMvc.perform(post("/api/v1/medicoes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sensorId\": 1, \"valor\": 45.2}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Garante que cidadão comum com token JWT não consegue enviar telemetria sem a chave de API")
    void deveRejeitarIngestaoMesmoComTokenJwtCidadao() throws Exception {
        // Envia token JWT de cidadão autenticado, mas SEM a chave X-Sensor-API-Key
        mockMvc.perform(post("/api/v1/medicoes")
                .header("Authorization", "Bearer " + tokenCidadao)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sensorId\": 1, \"valor\": 99.9}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
