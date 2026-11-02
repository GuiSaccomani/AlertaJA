package com.alertaja.config;

import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.RoleUsuario;
import com.alertaja.enums.TipoSensor;
import com.alertaja.model.Regiao;
import com.alertaja.model.Sensor;
import com.alertaja.model.Usuario;
import com.alertaja.repository.RegiaoRepository;
import com.alertaja.repository.SensorRepository;
import com.alertaja.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final RegiaoRepository regiaoRepository;
    private final SensorRepository sensorRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
        UsuarioRepository usuarioRepository,
        RegiaoRepository regiaoRepository,
        SensorRepository sensorRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.regiaoRepository = regiaoRepository;
        this.sensorRepository = sensorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("==> Inicializando sementes de dados do AlertaJá (Ambiente Dev/Prod)...");

        // 1. Usuário Administrador Padrão
        if (!usuarioRepository.existsByEmail("admin@alertaja.com")) {
            Usuario admin = Usuario.builder()
                    .nome("Administrador AlertaJá")
                    .email("admin@alertaja.com")
                    .senha(passwordEncoder.encode("Admin@123456"))
                    .role(RoleUsuario.ROLE_ADMIN)
                    .build();
            usuarioRepository.save(admin);
            log.info("Admin padrão criado com sucesso: admin@alertaja.com");
        }

        // 2. Região Padrão para Simulação
        String nomeRegiao = "Bacia Hidrográfica do Rio Tietê - Setor Sul";
        Regiao regiao = regiaoRepository.findByNome(nomeRegiao).orElseGet(() -> {
            Regiao r = Regiao.builder()
                    .nome(nomeRegiao)
                    .cidade("São Paulo")
                    .estado("SP")
                    .ativo(true)
                    .nivelRiscoAtual(NivelRisco.NORMAL)
                    .build();
            return regiaoRepository.save(r);
        });

        // 3. Sensor Pluviômetro Padrão (PLUV-SUL-01)
        if (!sensorRepository.existsByCodigoIdentificador("PLUV-SUL-01")) {
            Sensor pluv = Sensor.builder()
                    .codigoIdentificador("PLUV-SUL-01")
                    .tipo(TipoSensor.PLUVIOMETRO)
                    .regiao(regiao)
                    .unidadeMedida("mm/h")
                    .limiteAtencao(new BigDecimal("20.00"))
                    .limiteAlerta(new BigDecimal("40.00"))
                    .limitePerigo(new BigDecimal("60.00"))
                    .ativo(true)
                    .build();
            sensorRepository.save(pluv);
            log.info("Sensor Pluviômetro criado: PLUV-SUL-01 na região '{}'", regiao.getNome());
        }

        // 4. Sensor de Nível da Água Padrão (NIVEL-RIO-01)
        if (!sensorRepository.existsByCodigoIdentificador("NIVEL-RIO-01")) {
            Sensor nivel = Sensor.builder()
                    .codigoIdentificador("NIVEL-RIO-01")
                    .tipo(TipoSensor.NIVEL_AGUA)
                    .regiao(regiao)
                    .unidadeMedida("m")
                    .limiteAtencao(new BigDecimal("2.50"))
                    .limiteAlerta(new BigDecimal("4.00"))
                    .limitePerigo(new BigDecimal("5.50"))
                    .ativo(true)
                    .build();
            sensorRepository.save(nivel);
            log.info("Sensor Nível de Água criado: NIVEL-RIO-01 na região '{}'", regiao.getNome());
        }

        log.info("==> Sementes de dados prontas para operação!");
    }
}
