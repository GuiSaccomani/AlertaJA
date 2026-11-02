package com.alertaja.repository;

import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.RoleUsuario;
import com.alertaja.enums.StatusAlerta;
import com.alertaja.enums.TipoSensor;
import com.alertaja.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RepositoryIntegrationTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RegiaoRepository regiaoRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private MedicaoRepository medicaoRepository;

    @Autowired
    private AlertaRepository alertaRepository;

    private Regiao regiao;
    private Sensor sensorChuva;
    private Sensor sensorRio;

    @BeforeEach
    void setUp() {
        regiao = regiaoRepository.save(Regiao.builder()
                .nome("Bacia do Rio Tamanduateí")
                .cidade("São Paulo")
                .estado("SP")
                .nivelRiscoAtual(NivelRisco.NORMAL)
                .ativo(true)
                .build());

        sensorChuva = sensorRepository.save(Sensor.builder()
                .regiao(regiao)
                .codigoIdentificador("PLUV-TAM-01")
                .tipo(TipoSensor.PLUVIOMETRO)
                .unidadeMedida("mm")
                .limiteAtencao(new BigDecimal("30.00"))
                .limiteAlerta(new BigDecimal("50.00"))
                .limitePerigo(new BigDecimal("80.00"))
                .ativo(true)
                .build());

        sensorRio = sensorRepository.save(Sensor.builder()
                .regiao(regiao)
                .codigoIdentificador("NIV-TAM-02")
                .tipo(TipoSensor.NIVEL_AGUA)
                .unidadeMedida("m")
                .limiteAtencao(new BigDecimal("2.50"))
                .limiteAlerta(new BigDecimal("3.80"))
                .limitePerigo(new BigDecimal("5.00"))
                .ativo(true)
                .build());
    }

    @Test
    @DisplayName("Deve salvar usuário e validar unicidade de e-mail")
    void deveSalvarUsuarioEValidarEmailUnico() {
        Usuario usuario = Usuario.builder()
                .nome("Cidadão Teste")
                .email("cidadao@alertaja.com")
                .senha("$2a$12$hashSeguroBCrypt")
                .role(RoleUsuario.ROLE_CIDADAO)
                .build();

        Usuario salvo = usuarioRepository.save(usuario);
        assertNotNull(salvo.getId());
        assertEquals("cidadao@alertaja.com", salvo.getEmail());
        assertNotNull(salvo.getCriadoEm());

        Usuario duplicado = Usuario.builder()
                .nome("Outro Cidadão")
                .email("cidadao@alertaja.com")
                .senha("$2a$12$outroHash")
                .role(RoleUsuario.ROLE_CIDADAO)
                .build();

        assertThrows(DataIntegrityViolationException.class, () -> {
            usuarioRepository.saveAndFlush(duplicado);
        });
    }

    @Test
    @DisplayName("Deve consultar apenas regiões ativas com exclusão lógica")
    void deveConsultarRegioesComExclusaoLogica() {
        Regiao regiaoInativa = regiaoRepository.save(Regiao.builder()
                .nome("Região Desativada")
                .cidade("Santos")
                .estado("SP")
                .ativo(false)
                .build());

        List<Regiao> ativas = regiaoRepository.findByAtivoTrue();
        assertTrue(ativas.stream().anyMatch(r -> r.getId().equals(regiao.getId())));
        assertFalse(ativas.stream().anyMatch(r -> r.getId().equals(regiaoInativa.getId())));

        assertTrue(regiaoRepository.findByIdAndAtivoTrue(regiao.getId()).isPresent());
        assertFalse(regiaoRepository.findByIdAndAtivoTrue(regiaoInativa.getId()).isPresent());
    }

    @Test
    @DisplayName("Deve consultar sensores ativos de uma região para recálculo de risco")
    void deveConsultarSensoresAtivosDeUmaRegiao() {
        List<Sensor> sensoresAtivos = sensorRepository.findByRegiaoIdAndAtivoTrue(regiao.getId());
        assertEquals(2, sensoresAtivos.size());

        // Desativar logicamente um sensor
        sensorRio.desativar();
        sensorRepository.save(sensorRio);

        List<Sensor> sensoresAposDesativacao = sensorRepository.findByRegiaoIdAndAtivoTrue(regiao.getId());
        assertEquals(1, sensoresAposDesativacao.size());
        assertEquals("PLUV-TAM-01", sensoresAposDesativacao.get(0).getCodigoIdentificador());

        // Sensor inativo ainda pode ser consultado no repositório geral (histórico preservado)
        Optional<Sensor> sensorPreservado = sensorRepository.findById(sensorRio.getId());
        assertTrue(sensorPreservado.isPresent());
        assertFalse(sensorPreservado.get().getAtivo());
    }

    @Test
    @DisplayName("Deve registrar medições e consultar com paginação e ordenação decrescente por dataHora")
    void deveRegistrarMedicoesEConsultarPaginado() {
        LocalDateTime agora = LocalDateTime.now();

        Medicao m1 = medicaoRepository.save(Medicao.builder()
                .sensor(sensorChuva)
                .valor(new BigDecimal("15.50"))
                .dataHora(agora.minusMinutes(10))
                .build());

        Medicao m2 = medicaoRepository.save(Medicao.builder()
                .sensor(sensorChuva)
                .valor(new BigDecimal("35.00"))
                .dataHora(agora)
                .build());

        Page<Medicao> pagina = medicaoRepository.findComFiltros(
                sensorChuva.getId(),
                regiao.getId(),
                agora.minusHours(1),
                agora.plusHours(1),
                PageRequest.of(0, 10)
        );

        assertEquals(2, pagina.getTotalElements());
        assertEquals(m2.getId(), pagina.getContent().get(0).getId(), "A medição mais recente deve vir primeiro");
    }

    @Test
    @DisplayName("Deve registrar alerta com rastreabilidade da medição de origem e última ocorrência")
    void deveRegistrarAlertaComRastreabilidade() {
        LocalDateTime agora = LocalDateTime.now();

        Medicao medicaoOrigem = medicaoRepository.save(Medicao.builder()
                .sensor(sensorChuva)
                .valor(new BigDecimal("85.00")) // Acima do limite de perigo (80.00)
                .dataHora(agora.minusMinutes(15))
                .build());

        Alerta alerta = alertaRepository.save(Alerta.builder()
                .regiao(regiao)
                .sensor(sensorChuva)
                .medicaoOrigem(medicaoOrigem)
                .medicaoUltima(medicaoOrigem)
                .nivel(NivelRisco.PERIGO)
                .status(StatusAlerta.ATIVO)
                .titulo("Perigo de Alagamento na Bacia do Tamanduateí")
                .descricao("Índice pluviométrico atingiu nível crítico de 85mm. Risco iminente de transbordamento.")
                .ativo(true)
                .dataEmissao(agora.minusMinutes(15))
                .build());

        assertNotNull(alerta.getId());
        assertEquals(medicaoOrigem.getId(), alerta.getMedicaoOrigem().getId());
        assertEquals(medicaoOrigem.getId(), alerta.getMedicaoUltima().getId());

        // Simula atualização de última ocorrência com nova medição mantendo o alerta ativo
        Medicao novaMedicao = medicaoRepository.save(Medicao.builder()
                .sensor(sensorChuva)
                .valor(new BigDecimal("88.00"))
                .dataHora(agora)
                .build());

        alerta.atualizarUltimaOcorrencia(novaMedicao);
        Alerta alertaAtualizado = alertaRepository.save(alerta);

        assertEquals(medicaoOrigem.getId(), alertaAtualizado.getMedicaoOrigem().getId(), "Origem deve ser preservada");
        assertEquals(novaMedicao.getId(), alertaAtualizado.getMedicaoUltima().getId(), "Última ocorrência deve ser atualizada");

        // Verifica existência de alerta ativo por sensor e região
        assertTrue(alertaRepository.existsBySensorIdAndAtivoTrue(sensorChuva.getId()));
        assertTrue(alertaRepository.existsByRegiaoIdAndAtivoTrue(regiao.getId()));

        // Resolução automática do alerta
        alertaAtualizado.resolverAutomaticamente(agora.plusMinutes(30));
        alertaRepository.save(alertaAtualizado);

        assertFalse(alertaRepository.existsBySensorIdAndAtivoTrue(sensorChuva.getId()));
        assertEquals(StatusAlerta.RESOLVIDO_AUTO, alertaAtualizado.getStatus());
    }

    @Test
    @DisplayName("Deve verificar que o modelo de avaliação de risco do sensor calcula os níveis corretamente")
    void deveAvaliarNivelRiscoDoSensorCorretamente() {
        assertEquals(NivelRisco.NORMAL, sensorChuva.avaliarNivelRisco(new BigDecimal("10.00")));
        assertEquals(NivelRisco.ATENCAO, sensorChuva.avaliarNivelRisco(new BigDecimal("30.00")));
        assertEquals(NivelRisco.ATENCAO, sensorChuva.avaliarNivelRisco(new BigDecimal("49.99")));
        assertEquals(NivelRisco.ALERTA, sensorChuva.avaliarNivelRisco(new BigDecimal("50.00")));
        assertEquals(NivelRisco.ALERTA, sensorChuva.avaliarNivelRisco(new BigDecimal("79.99")));
        assertEquals(NivelRisco.PERIGO, sensorChuva.avaliarNivelRisco(new BigDecimal("80.00")));
        assertEquals(NivelRisco.PERIGO, sensorChuva.avaliarNivelRisco(new BigDecimal("120.00")));
    }
}
