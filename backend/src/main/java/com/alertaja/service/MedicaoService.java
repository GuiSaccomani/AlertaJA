package com.alertaja.service;

import com.alertaja.dto.MedicaoRequest;
import com.alertaja.dto.MedicaoResponse;
import com.alertaja.enums.NivelRisco;
import com.alertaja.exception.RegraNegocioException;
import com.alertaja.exception.ResourceNotFoundException;
import com.alertaja.model.Medicao;
import com.alertaja.model.Sensor;
import com.alertaja.repository.MedicaoRepository;
import com.alertaja.repository.SensorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class MedicaoService {

    private final MedicaoRepository medicaoRepository;
    private final SensorRepository sensorRepository;
    private final MotorAlertasService motorAlertasService;

    public MedicaoService(
        MedicaoRepository medicaoRepository,
        SensorRepository sensorRepository,
        MotorAlertasService motorAlertasService
    ) {
        this.medicaoRepository = medicaoRepository;
        this.sensorRepository = sensorRepository;
        this.motorAlertasService = motorAlertasService;
    }

    /**
     * Ingestão transacional de medição:
     * Valida integridade do sensor e da região, persiste a medição, atualiza a última leitura do sensor
     * e aciona o motor de alertas e recálculo de risco regional de forma totalmente atômica.
     */
    @Transactional
    public MedicaoResponse registrarMedicao(MedicaoRequest request) {
        Sensor sensor;
        if (request.sensorId() != null) {
            sensor = sensorRepository.findById(request.sensorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sensor não encontrado com ID: " + request.sensorId()));
        } else if (request.sensorCodigo() != null && !request.sensorCodigo().isBlank()) {
            sensor = sensorRepository.findByCodigoIdentificador(request.sensorCodigo().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Sensor não encontrado com código: " + request.sensorCodigo()));
        } else {
            throw new RegraNegocioException("É obrigatório informar o sensorId ou o sensorCodigo.");
        }

        if (!sensor.getAtivo()) {
            throw new RegraNegocioException("Sensor inativo (" + sensor.getCodigoIdentificador() + "). Ingestão de medições rejeitada.");
        }

        if (!sensor.getRegiao().getAtivo()) {
            throw new RegraNegocioException("A região associada ao sensor está inativa. Ingestão de medições rejeitada.");
        }

        LocalDateTime dataHora = request.dataHora() != null ? request.dataHora() : LocalDateTime.now();

        Medicao medicao = Medicao.builder()
                .sensor(sensor)
                .valor(request.valor())
                .dataHora(dataHora)
                .build();

        Medicao medicaoSalva = medicaoRepository.save(medicao);

        sensor.setUltimaLeitura(dataHora);
        sensorRepository.save(sensor);

        // Processamento atômico do motor de alertas e recálculo do risco regional
        motorAlertasService.processarAlertaEMedicao(sensor, medicaoSalva);

        NivelRisco nivelDetectado = sensor.avaliarNivelRisco(medicaoSalva.getValor());
        return MedicaoResponse.fromEntity(medicaoSalva, nivelDetectado);
    }

    @Transactional(readOnly = true)
    public Page<MedicaoResponse> listarComFiltros(
        Long sensorId,
        Long regiaoId,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        Pageable pageable
    ) {
        Page<Medicao> pagina = medicaoRepository.findComFiltros(sensorId, regiaoId, dataInicio, dataFim, pageable);
        return pagina.map(m -> {
            NivelRisco nivel = m.getSensor().avaliarNivelRisco(m.getValor());
            return MedicaoResponse.fromEntity(m, nivel);
        });
    }
}
