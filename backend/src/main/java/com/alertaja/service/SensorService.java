package com.alertaja.service;

import com.alertaja.dto.SensorRequest;
import com.alertaja.dto.SensorResponse;
import com.alertaja.exception.RegraNegocioException;
import com.alertaja.exception.ResourceNotFoundException;
import com.alertaja.model.Regiao;
import com.alertaja.model.Sensor;
import com.alertaja.repository.AlertaRepository;
import com.alertaja.repository.RegiaoRepository;
import com.alertaja.repository.SensorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class SensorService {

    private final SensorRepository sensorRepository;
    private final RegiaoRepository regiaoRepository;
    private final AlertaRepository alertaRepository;

    public SensorService(
        SensorRepository sensorRepository,
        RegiaoRepository regiaoRepository,
        AlertaRepository alertaRepository
    ) {
        this.sensorRepository = sensorRepository;
        this.regiaoRepository = regiaoRepository;
        this.alertaRepository = alertaRepository;
    }

    @Transactional
    public SensorResponse criar(SensorRequest request) {
        Regiao regiao = regiaoRepository.findById(request.regiaoId())
                .orElseThrow(() -> new ResourceNotFoundException("Região não encontrada com ID: " + request.regiaoId()));

        if (!regiao.getAtivo()) {
            throw new RegraNegocioException("Não é possível vincular um sensor a uma região inativa.");
        }

        String codigo = request.codigoIdentificador().trim().toUpperCase();
        if (sensorRepository.existsByCodigoIdentificador(codigo)) {
            throw new RegraNegocioException("Já existe um sensor cadastrado com o código: " + codigo);
        }

        validarLimiares(request.limiteAtencao(), request.limiteAlerta(), request.limitePerigo());

        Sensor sensor = Sensor.builder()
                .regiao(regiao)
                .codigoIdentificador(codigo)
                .tipo(request.tipo())
                .unidadeMedida(request.unidadeMedida().trim())
                .limiteAtencao(request.limiteAtencao())
                .limiteAlerta(request.limiteAlerta())
                .limitePerigo(request.limitePerigo())
                .ativo(true)
                .build();

        Sensor salvo = sensorRepository.save(sensor);
        return SensorResponse.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public SensorResponse buscarPorId(Long id) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor não encontrado com ID: " + id));
        return SensorResponse.fromEntity(sensor);
    }

    @Transactional(readOnly = true)
    public Page<SensorResponse> listar(Long regiaoId, Boolean ativo, Pageable pageable) {
        Page<Sensor> pagina = sensorRepository.findComFiltros(regiaoId, ativo, pageable);
        return pagina.map(SensorResponse::fromEntity);
    }

    @Transactional
    public SensorResponse atualizar(Long id, SensorRequest request) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor não encontrado com ID: " + id));

        if (!sensor.getAtivo()) {
            throw new RegraNegocioException("Não é permitido alterar um sensor inativo. Reative-o primeiro.");
        }

        Regiao regiao = regiaoRepository.findById(request.regiaoId())
                .orElseThrow(() -> new ResourceNotFoundException("Região não encontrada com ID: " + request.regiaoId()));

        if (!regiao.getAtivo()) {
            throw new RegraNegocioException("Não é possível associar o sensor a uma região inativa.");
        }

        String novoCodigo = request.codigoIdentificador().trim().toUpperCase();
        if (!sensor.getCodigoIdentificador().equals(novoCodigo) && sensorRepository.existsByCodigoIdentificador(novoCodigo)) {
            throw new RegraNegocioException("Já existe outro sensor cadastrado com o código: " + novoCodigo);
        }

        validarLimiares(request.limiteAtencao(), request.limiteAlerta(), request.limitePerigo());

        sensor.setRegiao(regiao);
        sensor.setCodigoIdentificador(novoCodigo);
        sensor.setTipo(request.tipo());
        sensor.setUnidadeMedida(request.unidadeMedida().trim());
        sensor.setLimiteAtencao(request.limiteAtencao());
        sensor.setLimiteAlerta(request.limiteAlerta());
        sensor.setLimitePerigo(request.limitePerigo());

        Sensor atualizado = sensorRepository.save(sensor);
        return SensorResponse.fromEntity(atualizado);
    }

    @Transactional
    public void desativar(Long id) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor não encontrado com ID: " + id));

        if (!sensor.getAtivo()) {
            throw new RegraNegocioException("O sensor já se encontra inativo.");
        }

        sensor.desativar();
        sensorRepository.save(sensor);

        // Encerra qualquer alerta ativo gerado por este sensor
        alertaRepository.findBySensorIdAndAtivoTrue(id).forEach(alerta -> {
            alerta.resolverAutomaticamente(LocalDateTime.now());
            alertaRepository.save(alerta);
        });
    }

    @Transactional
    public SensorResponse reativar(Long id) {
        Sensor sensor = sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor não encontrado com ID: " + id));

        if (sensor.getAtivo()) {
            throw new RegraNegocioException("O sensor já se encontra ativo.");
        }

        if (!sensor.getRegiao().getAtivo()) {
            throw new RegraNegocioException("Não é possível reativar um sensor cuja região está inativa.");
        }

        sensor.ativar();
        Sensor salvo = sensorRepository.save(sensor);
        return SensorResponse.fromEntity(salvo);
    }

    private void validarLimiares(BigDecimal atencao, BigDecimal alerta, BigDecimal perigo) {
        if (atencao == null || alerta == null || perigo == null) {
            throw new RegraNegocioException("Os limiares de Atenção, Alerta e Perigo são obrigatórios.");
        }
        if (atencao.compareTo(alerta) >= 0) {
            throw new RegraNegocioException("O limite de Atenção (" + atencao + ") deve ser estritamente menor que o limite de Alerta (" + alerta + ").");
        }
        if (alerta.compareTo(perigo) >= 0) {
            throw new RegraNegocioException("O limite de Alerta (" + alerta + ") deve ser estritamente menor que o limite de Perigo (" + perigo + ").");
        }
    }
}
