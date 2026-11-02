package com.alertaja.service;

import com.alertaja.dto.MedicaoRequest;
import com.alertaja.dto.MedicaoResponse;
import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.RoleUsuario;
import com.alertaja.enums.StatusAlerta;
import com.alertaja.enums.TipoSensor;
import com.alertaja.exception.RegraNegocioException;
import com.alertaja.model.Alerta;
import com.alertaja.model.Medicao;
import com.alertaja.model.Regiao;
import com.alertaja.model.Sensor;
import com.alertaja.model.Usuario;
import com.alertaja.repository.AlertaRepository;
import com.alertaja.repository.MedicaoRepository;
import com.alertaja.repository.RegiaoRepository;
import com.alertaja.repository.SensorRepository;
import com.alertaja.repository.UsuarioRepository;
import com.alertaja.security.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MotorAlertasETelemetriaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MedicaoService medicaoService;

    @SpyBean
    private MotorAlertasService motorAlertasService;

    @Autowired
    private RegiaoRepository regiaoRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private MedicaoRepository medicaoRepository;

    @Autowired
    private AlertaRepository alertaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private Regiao regiao;
    private Sensor sensorChuva;
    private Sensor sensorRio;
    private String tokenAdmin;
    private String tokenCidadao;

    @BeforeEach
    void setUp() {
        alertaRepository.deleteAll();
        medicaoRepository.deleteAll();

        Usuario admin = usuarioRepository.findByEmail("admin.alertas@alertaja.com")
                .orElseGet(() -> usuarioRepository.save(Usuario.builder()
                        .nome("Admin Alertas")
                        .email("admin.alertas@alertaja.com")
                        .senha(passwordEncoder.encode("senhaAdmin123"))
                        .role(RoleUsuario.ROLE_ADMIN)
                        .build()));

        Usuario cidadao = usuarioRepository.findByEmail("cidadao.alertas@alertaja.com")
                .orElseGet(() -> usuarioRepository.save(Usuario.builder()
                        .nome("Cidadão Alertas")
                        .email("cidadao.alertas@alertaja.com")
                        .senha(passwordEncoder.encode("senhaCidadao123"))
                        .role(RoleUsuario.ROLE_CIDADAO)
                        .build()));

        tokenAdmin = jwtTokenService.gerarToken(admin.getId(), admin.getEmail(), admin.getNome(), admin.getRole());
        tokenCidadao = jwtTokenService.gerarToken(cidadao.getId(), cidadao.getEmail(), cidadao.getNome(), cidadao.getRole());

        regiao = regiaoRepository.findAll().stream()
                .filter(r -> "Bacia do Rio Tamanduateí".equals(r.getNome()))
                .findFirst()
                .orElseGet(() -> regiaoRepository.save(Regiao.builder()
                        .nome("Bacia do Rio Tamanduateí")
                        .cidade("São Paulo")
                        .estado("SP")
                        .nivelRiscoAtual(NivelRisco.NORMAL)
                        .ativo(true)
                        .build()));
        regiao.setNivelRiscoAtual(NivelRisco.NORMAL);
        regiao.ativar();
        regiao = regiaoRepository.save(regiao);

        // Limiares: Atenção = 30mm, Alerta = 50mm, Perigo = 80mm
        sensorChuva = sensorRepository.findByCodigoIdentificador("PLUV-TAM-01")
                .orElseGet(() -> sensorRepository.save(Sensor.builder()
                        .regiao(regiao)
                        .codigoIdentificador("PLUV-TAM-01")
                        .tipo(TipoSensor.PLUVIOMETRO)
                        .unidadeMedida("mm")
                        .limiteAtencao(new BigDecimal("30.00"))
                        .limiteAlerta(new BigDecimal("50.00"))
                        .limitePerigo(new BigDecimal("80.00"))
                        .ativo(true)
                        .build()));
        sensorChuva.ativar();
        sensorChuva.setRegiao(regiao);
        sensorChuva = sensorRepository.save(sensorChuva);

        // Limiares: Atenção = 2.0m, Alerta = 3.5m, Perigo = 5.0m
        sensorRio = sensorRepository.findByCodigoIdentificador("NIV-TAM-02")
                .orElseGet(() -> sensorRepository.save(Sensor.builder()
                        .regiao(regiao)
                        .codigoIdentificador("NIV-TAM-02")
                        .tipo(TipoSensor.NIVEL_AGUA)
                        .unidadeMedida("m")
                        .limiteAtencao(new BigDecimal("2.00"))
                        .limiteAlerta(new BigDecimal("3.50"))
                        .limitePerigo(new BigDecimal("5.00"))
                        .ativo(true)
                        .build()));
        sensorRio.ativar();
        sensorRio.setRegiao(regiao);
        sensorRio = sensorRepository.save(sensorRio);
    }

    @Test
    @DisplayName("Deve rejeitar ingestão de medição para sensor inativo")
    void deveRejeitarMedicaoSensorInativo() {
        sensorChuva.desativar();
        sensorRepository.save(sensorChuva);

        MedicaoRequest request = new MedicaoRequest(sensorChuva.getId(), new BigDecimal("25.00"), LocalDateTime.now());

        RegraNegocioException exception = assertThrows(
            RegraNegocioException.class,
            () -> medicaoService.registrarMedicao(request)
        );

        assertTrue(exception.getMessage().contains("Sensor inativo"));
    }

    @Test
    @DisplayName("Deve gerar alerta nos três níveis de risco (ATENCAO, ALERTA e PERIGO)")
    void deveGerarAlertasNosTresNiveis() {
        // 1. Nível ATENCAO (35mm >= 30mm)
        MedicaoResponse respAtencao = medicaoService.registrarMedicao(
            new MedicaoRequest(sensorChuva.getId(), new BigDecimal("35.00"), LocalDateTime.now())
        );
        assertEquals(NivelRisco.ATENCAO, respAtencao.nivelRiscoDetectado());
        Alerta alertaAtencao = alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).orElseThrow();
        assertEquals(NivelRisco.ATENCAO, alertaAtencao.getNivel());
        assertEquals(NivelRisco.ATENCAO, regiaoRepository.findById(regiao.getId()).orElseThrow().getNivelRiscoAtual());

        // 2. Normaliza para limpar
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("10.00"), LocalDateTime.now()));

        // 3. Nível ALERTA (60mm >= 50mm e < 80mm)
        MedicaoResponse respAlerta = medicaoService.registrarMedicao(
            new MedicaoRequest(sensorChuva.getId(), new BigDecimal("60.00"), LocalDateTime.now())
        );
        assertEquals(NivelRisco.ALERTA, respAlerta.nivelRiscoDetectado());
        Alerta alertaAlerta = alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).orElseThrow();
        assertEquals(NivelRisco.ALERTA, alertaAlerta.getNivel());

        // 4. Normaliza para limpar
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("10.00"), LocalDateTime.now()));

        // 5. Nível PERIGO (95mm >= 80mm)
        MedicaoResponse respPerigo = medicaoService.registrarMedicao(
            new MedicaoRequest(sensorChuva.getId(), new BigDecimal("95.00"), LocalDateTime.now())
        );
        assertEquals(NivelRisco.PERIGO, respPerigo.nivelRiscoDetectado());
        Alerta alertaPerigo = alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).orElseThrow();
        assertEquals(NivelRisco.PERIGO, alertaPerigo.getNivel());
    }

    @Test
    @DisplayName("Deve aplicar anti-duplicação atualizando última ocorrência para medições subsequentes no mesmo nível")
    void deveAplicarAntiDuplicacao() {
        LocalDateTime t1 = LocalDateTime.now().minusMinutes(5);
        LocalDateTime t2 = LocalDateTime.now();

        // Primeira medição no nível ATENCAO
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("35.00"), t1));
        List<Alerta> alertasAntes = alertaRepository.findBySensorIdAndAtivoTrue(sensorChuva.getId());
        assertEquals(1, alertasAntes.size());
        Alerta alertaOriginal = alertasAntes.get(0);
        Long idAlerta = alertaOriginal.getId();
        Long idMedicaoOrigem = alertaOriginal.getMedicaoOrigem().getId();

        // Segunda medição também no nível ATENCAO (42mm)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("42.00"), t2));
        List<Alerta> alertasDepois = alertaRepository.findBySensorIdAndAtivoTrue(sensorChuva.getId());

        assertEquals(1, alertasDepois.size(), "Não deve criar outro alerta, apenas atualizar o existente");
        Alerta alertaAtualizado = alertasDepois.get(0);
        assertEquals(idAlerta, alertaAtualizado.getId(), "O ID do alerta deve ser rigorosamente o mesmo");
        assertEquals(idMedicaoOrigem, alertaAtualizado.getMedicaoOrigem().getId(), "A medição de origem deve ser preservada");
        assertNotEquals(alertaAtualizado.getMedicaoOrigem().getId(), alertaAtualizado.getMedicaoUltima().getId(), "A última medição deve ser atualizada");
    }

    @Test
    @DisplayName("Deve escalonar de ATENÇÃO para PERIGO encerrando o anterior e criando novo alerta")
    void deveEscalonarAlertaCorretamente() {
        // Inicia em ATENCAO (35mm)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("35.00"), LocalDateTime.now().minusMinutes(10)));
        Alerta alertaAtencao = alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).orElseThrow();
        assertEquals(NivelRisco.ATENCAO, alertaAtencao.getNivel());

        // Escala para PERIGO (85mm)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("85.00"), LocalDateTime.now()));

        // O alerta anterior de ATENCAO deve ter sido resolvido automaticamente
        Alerta alertaAtencaoResolvido = alertaRepository.findById(alertaAtencao.getId()).orElseThrow();
        assertFalse(alertaAtencaoResolvido.getAtivo(), "Alerta de Atenção deve ser desativado no escalonamento");
        assertEquals(StatusAlerta.RESOLVIDO_AUTO, alertaAtencaoResolvido.getStatus());

        // O novo alerta ativo deve ser de PERIGO
        Alerta alertaNovoPerigo = alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).orElseThrow();
        assertEquals(NivelRisco.PERIGO, alertaNovoPerigo.getNivel());
        assertTrue(alertaNovoPerigo.getAtivo());
    }

    @Test
    @DisplayName("Deve resolver automaticamente alertas quando medição retornar a NORMAL")
    void deveResolverAutomaticamenteAoNormalizar() {
        // Dispara Alerta
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("45.00"), LocalDateTime.now()));
        assertTrue(alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).isPresent());

        // Normaliza (15mm < 30mm)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("15.00"), LocalDateTime.now()));

        // Nenhum alerta ativo deve restar para este sensor
        assertFalse(alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).isPresent());

        // Risco regional deve retornar a NORMAL
        Regiao regiaoAtual = regiaoRepository.findById(regiao.getId()).orElseThrow();
        assertEquals(NivelRisco.NORMAL, regiaoAtual.getNivelRiscoAtual());
    }

    @Test
    @DisplayName("Recálculo regional com múltiplos sensores: normalização de um não apaga risco de outro")
    void deveRecalcularRiscoComMultiplosSensores() {
        // Sensor de Chuva atinge PERIGO (90mm)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("90.00"), LocalDateTime.now()));
        Regiao regiaoAposChuva = regiaoRepository.findById(regiao.getId()).orElseThrow();
        assertEquals(NivelRisco.PERIGO, regiaoAposChuva.getNivelRiscoAtual());

        // Sensor do Rio entra em ATENCAO (2.5m)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorRio.getId(), new BigDecimal("2.50"), LocalDateTime.now()));
        Regiao regiaoComDoisRiscos = regiaoRepository.findById(regiao.getId()).orElseThrow();
        assertEquals(NivelRisco.PERIGO, regiaoComDoisRiscos.getNivelRiscoAtual(), "Maior risco deve prevalecer (PERIGO > ATENCAO)");

        // Sensor de Chuva NORMALIZA (10mm)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("10.00"), LocalDateTime.now()));

        // Região NÃO pode ir para NORMAL pois o Sensor do Rio ainda está em ATENÇÃO!
        Regiao regiaoAposNormalizarChuva = regiaoRepository.findById(regiao.getId()).orElseThrow();
        assertEquals(NivelRisco.ATENCAO, regiaoAposNormalizarChuva.getNivelRiscoAtual(), "A região deve assumir o nível do sensor restante (ATENCAO)");

        // Sensor do Rio também NORMALIZA (1.0m)
        medicaoService.registrarMedicao(new MedicaoRequest(sensorRio.getId(), new BigDecimal("1.00"), LocalDateTime.now()));
        Regiao regiaoTodaNormal = regiaoRepository.findById(regiao.getId()).orElseThrow();
        assertEquals(NivelRisco.NORMAL, regiaoTodaNormal.getNivelRiscoAtual(), "Agora sim a região deve retornar para NORMAL");
    }

    @Test
    @DisplayName("Admin deve resolver alerta manualmente via PATCH e Cidadão deve ser proibido (403)")
    void deveResolverAlertaManualmente() throws Exception {
        // Dispara alerta
        medicaoService.registrarMedicao(new MedicaoRequest(sensorChuva.getId(), new BigDecimal("40.00"), LocalDateTime.now()));
        Alerta alerta = alertaRepository.findFirstBySensorIdAndAtivoTrue(sensorChuva.getId()).orElseThrow();

        // Cidadão tenta resolver manualmente -> 403 Forbidden
        mockMvc.perform(patch("/api/v1/alertas/" + alerta.getId() + "/resolver")
                .header("Authorization", "Bearer " + tokenCidadao))
                .andExpect(status().isForbidden());

        // Admin resolve manualmente -> 200 OK
        mockMvc.perform(patch("/api/v1/alertas/" + alerta.getId() + "/resolver")
                .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVIDO_MANUAL"))
                .andExpect(jsonPath("$.ativo").value(false));

        Alerta resolvido = alertaRepository.findById(alerta.getId()).orElseThrow();
        assertFalse(resolvido.getAtivo());
        assertEquals(StatusAlerta.RESOLVIDO_MANUAL, resolvido.getStatus());
        assertNotNull(resolvido.getDataResolucao());
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    @DisplayName("Garante rollback transacional: falha no processamento de alertas não deve persistir a medição")
    void deveFazerRollbackEmCasoDeFalha() {
        long contagemAntes = medicaoRepository.count();

        // Força uma falha simulada no motor de alertas
        doThrow(new RuntimeException("Simulação de falha crítica no motor de alertas"))
                .when(motorAlertasService).processarAlertaEMedicao(any(), any());

        MedicaoRequest request = new MedicaoRequest(sensorChuva.getId(), new BigDecimal("35.00"), LocalDateTime.now());

        assertThrows(RuntimeException.class, () -> medicaoService.registrarMedicao(request));

        long contagemDepois = medicaoRepository.count();
        assertEquals(contagemAntes, contagemDepois, "A medição não deve ter sido persistida devido ao rollback transacional");
    }
}
