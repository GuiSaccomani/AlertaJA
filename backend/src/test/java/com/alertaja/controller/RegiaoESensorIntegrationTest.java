package com.alertaja.controller;

import com.alertaja.dto.RegiaoRequest;
import com.alertaja.dto.SensorRequest;
import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.RoleUsuario;
import com.alertaja.enums.TipoSensor;
import com.alertaja.model.Regiao;
import com.alertaja.model.Sensor;
import com.alertaja.model.Usuario;
import com.alertaja.repository.AlertaRepository;
import com.alertaja.repository.MedicaoRepository;
import com.alertaja.repository.RegiaoRepository;
import com.alertaja.repository.SensorRepository;
import com.alertaja.repository.UsuarioRepository;
import com.alertaja.security.JwtTokenService;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RegiaoESensorIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RegiaoRepository regiaoRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AlertaRepository alertaRepository;

    @Autowired
    private MedicaoRepository medicaoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String tokenAdmin;
    private String tokenCidadao;
    private Regiao regiaoAtiva;
    private Sensor sensorAtivo;

    @BeforeEach
    void setUp() {
        alertaRepository.deleteAll();
        medicaoRepository.deleteAll();
        sensorRepository.deleteAll();
        regiaoRepository.deleteAll();
        usuarioRepository.deleteAll();

        Usuario admin = usuarioRepository.save(Usuario.builder()
                .nome("Admin Teste")
                .email("admin.teste@alertaja.com")
                .senha(passwordEncoder.encode("senhaAdmin123"))
                .role(RoleUsuario.ROLE_ADMIN)
                .build());

        Usuario cidadao = usuarioRepository.save(Usuario.builder()
                .nome("Cidadão Teste")
                .email("cidadao.teste@alertaja.com")
                .senha(passwordEncoder.encode("senhaCidadao123"))
                .role(RoleUsuario.ROLE_CIDADAO)
                .build());

        tokenAdmin = jwtTokenService.gerarToken(admin.getId(), admin.getEmail(), admin.getNome(), admin.getRole());
        tokenCidadao = jwtTokenService.gerarToken(cidadao.getId(), cidadao.getEmail(), cidadao.getNome(), cidadao.getRole());

        regiaoAtiva = regiaoRepository.save(Regiao.builder()
                .nome("Zona Leste - Tatuapé")
                .cidade("São Paulo")
                .estado("SP")
                .nivelRiscoAtual(NivelRisco.NORMAL)
                .ativo(true)
                .build());

        sensorAtivo = sensorRepository.save(Sensor.builder()
                .regiao(regiaoAtiva)
                .codigoIdentificador("PLUV-TAT-01")
                .tipo(TipoSensor.PLUVIOMETRO)
                .unidadeMedida("mm")
                .limiteAtencao(new BigDecimal("20.00"))
                .limiteAlerta(new BigDecimal("40.00"))
                .limitePerigo(new BigDecimal("60.00"))
                .ativo(true)
                .build());
    }

    @Test
    @DisplayName("Admin deve criar nova região com sucesso")
    void deveCriarRegiaoComoAdmin() throws Exception {
        RegiaoRequest request = new RegiaoRequest("Zona Sul - Santo Amaro", "São Paulo", "SP");

        mockMvc.perform(post("/api/v1/regioes")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.nome").value("Zona Sul - Santo Amaro"))
                .andExpect(jsonPath("$.nivelRiscoAtual").value("NORMAL"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    @DisplayName("Cidadão deve ser proibido de criar região (403 Forbidden)")
    void deveProibirCidadaoDeCriarRegiao() throws Exception {
        RegiaoRequest request = new RegiaoRequest("Zona Norte - Santana", "São Paulo", "SP");

        mockMvc.perform(post("/api/v1/regioes")
                .header("Authorization", "Bearer " + tokenCidadao)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin deve desativar região (soft delete) e desativar sensores associados")
    void deveDesativarRegiaoComExclusaoLogica() throws Exception {
        mockMvc.perform(delete("/api/v1/regioes/" + regiaoAtiva.getId())
                .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNoContent());

        Regiao desativada = regiaoRepository.findById(regiaoAtiva.getId()).orElseThrow();
        assertFalse(desativada.getAtivo(), "A região deve ser marcada com ativo = false");

        Sensor sensorDesativado = sensorRepository.findById(sensorAtivo.getId()).orElseThrow();
        assertFalse(sensorDesativado.getAtivo(), "O sensor da região desativada também deve ficar inativo");
    }

    @Test
    @DisplayName("Deve rejeitar atualização em região inativa com 400 Bad Request")
    void deveRejeitarAtualizacaoEmRegiaoInativa() throws Exception {
        regiaoAtiva.desativar();
        regiaoRepository.save(regiaoAtiva);

        RegiaoRequest update = new RegiaoRequest("Novo Nome", "São Paulo", "SP");

        mockMvc.perform(put("/api/v1/regioes/" + regiaoAtiva.getId())
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Não é permitido atualizar uma região inativa. Reative-a primeiro."));
    }

    @Test
    @DisplayName("Admin deve cadastrar sensor com limiares válidos")
    void deveCadastrarSensorComSucesso() throws Exception {
        SensorRequest request = new SensorRequest(
                regiaoAtiva.getId(),
                "NIV-TAT-02",
                TipoSensor.NIVEL_AGUA,
                "m",
                new BigDecimal("1.50"),
                new BigDecimal("2.50"),
                new BigDecimal("3.50")
        );

        mockMvc.perform(post("/api/v1/sensores")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.codigoIdentificador").value("NIV-TAT-02"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    @DisplayName("Deve rejeitar sensor com ordem incorreta de limiares (Atenção >= Alerta ou Alerta >= Perigo)")
    void deveRejeitarLimiaresInvalidos() throws Exception {
        // Atenção (40.0) maior que Alerta (30.0)
        SensorRequest requestInvalido = new SensorRequest(
                regiaoAtiva.getId(),
                "PLUV-ERR-01",
                TipoSensor.PLUVIOMETRO,
                "mm",
                new BigDecimal("40.00"),
                new BigDecimal("30.00"),
                new BigDecimal("50.00")
        );

        mockMvc.perform(post("/api/v1/sensores")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O limite de Atenção (40.00) deve ser estritamente menor que o limite de Alerta (30.00)."));
    }

    @Test
    @DisplayName("Deve rejeitar vincular sensor a uma região inativa")
    void deveRejeitarSensorEmRegiaoInativa() throws Exception {
        regiaoAtiva.desativar();
        regiaoRepository.save(regiaoAtiva);

        SensorRequest request = new SensorRequest(
                regiaoAtiva.getId(),
                "PLUV-INATIVO-01",
                TipoSensor.PLUVIOMETRO,
                "mm",
                new BigDecimal("10.00"),
                new BigDecimal("20.00"),
                new BigDecimal("30.00")
        );

        mockMvc.perform(post("/api/v1/sensores")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Não é possível vincular um sensor a uma região inativa."));
    }

    @Test
    @DisplayName("Deve rejeitar sensor com código identificador duplicado")
    void deveRejeitarCodigoSensorDuplicado() throws Exception {
        SensorRequest requestDuplicado = new SensorRequest(
                regiaoAtiva.getId(),
                "PLUV-TAT-01", // Código já existente
                TipoSensor.PLUVIOMETRO,
                "mm",
                new BigDecimal("10.00"),
                new BigDecimal("20.00"),
                new BigDecimal("30.00")
        );

        mockMvc.perform(post("/api/v1/sensores")
                .header("Authorization", "Bearer " + tokenAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDuplicado)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Já existe um sensor cadastrado com o código: PLUV-TAT-01"));
    }

    @Test
    @DisplayName("Admin deve desativar sensor (soft delete) e cidadão não pode desativar")
    void deveDesativarSensorComSucessoEBloquearCidadao() throws Exception {
        // Cidadão tenta desativar -> 403 Forbidden
        mockMvc.perform(delete("/api/v1/sensores/" + sensorAtivo.getId())
                .header("Authorization", "Bearer " + tokenCidadao))
                .andExpect(status().isForbidden());

        // Admin desativa -> 204 No Content
        mockMvc.perform(delete("/api/v1/sensores/" + sensorAtivo.getId())
                .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNoContent());

        Sensor desativado = sensorRepository.findById(sensorAtivo.getId()).orElseThrow();
        assertFalse(desativado.getAtivo(), "Sensor deve ser preservado com ativo = false");
    }
}
