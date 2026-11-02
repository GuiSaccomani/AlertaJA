package com.alertaja.service;

import com.alertaja.dto.AlertaResponse;
import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.StatusAlerta;
import com.alertaja.exception.RegraNegocioException;
import com.alertaja.exception.ResourceNotFoundException;
import com.alertaja.model.Alerta;
import com.alertaja.model.Medicao;
import com.alertaja.model.Regiao;
import com.alertaja.model.Sensor;
import com.alertaja.repository.AlertaRepository;
import com.alertaja.repository.RegiaoRepository;
import com.alertaja.repository.SensorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MotorAlertasService {

    private final AlertaRepository alertaRepository;
    private final SensorRepository sensorRepository;
    private final RegiaoRepository regiaoRepository;

    public MotorAlertasService(
        AlertaRepository alertaRepository,
        SensorRepository sensorRepository,
        RegiaoRepository regiaoRepository
    ) {
        this.alertaRepository = alertaRepository;
        this.sensorRepository = sensorRepository;
        this.regiaoRepository = regiaoRepository;
    }

    @Transactional
    public Alerta processarAlertaEMedicao(Sensor sensor, Medicao medicao) {
        NivelRisco nivelDetectado = sensor.avaliarNivelRisco(medicao.getValor());
        Optional<Alerta> alertaAtivoOpt = alertaRepository.findFirstBySensorIdAndAtivoTrue(sensor.getId());

        Alerta alertaResultante = null;

        if (nivelDetectado == NivelRisco.NORMAL) {
            // Sensor normalizou: encerra qualquer alerta ativo vinculado a este sensor
            if (alertaAtivoOpt.isPresent()) {
                Alerta alertaAtivo = alertaAtivoOpt.get();
                alertaAtivo.resolverAutomaticamente(medicao.getDataHora());
                alertaRepository.save(alertaAtivo);
            }
        } else {
            // Sensor detectou risco (ATENCAO, ALERTA ou PERIGO)
            if (alertaAtivoOpt.isEmpty()) {
                // 1. Não há alerta ativo: cria novo alerta
                Alerta novoAlerta = Alerta.builder()
                        .regiao(sensor.getRegiao())
                        .sensor(sensor)
                        .medicaoOrigem(medicao)
                        .medicaoUltima(medicao)
                        .nivel(nivelDetectado)
                        .status(StatusAlerta.ATIVO)
                        .titulo(gerarTitulo(sensor, nivelDetectado))
                        .descricao(gerarDescricao(sensor, medicao, nivelDetectado))
                        .ativo(true)
                        .dataEmissao(medicao.getDataHora())
                        .dataUltimaOcorrencia(medicao.getDataHora())
                        .build();
                alertaResultante = alertaRepository.save(novoAlerta);
            } else {
                Alerta alertaAtivo = alertaAtivoOpt.get();

                if (alertaAtivo.getNivel() == nivelDetectado) {
                    // 2. Anti-duplicação: mesmo nível de risco -> atualiza última medição e horário
                    alertaAtivo.atualizarUltimaOcorrencia(medicao);
                    alertaResultante = alertaRepository.save(alertaAtivo);
                } else {
                    // 3. Mudança de patamar (escalonamento para cima ou redução):
                    // Encerra o alerta anterior e cria o novo com nível correspondente
                    alertaAtivo.resolverAutomaticamente(medicao.getDataHora());
                    alertaRepository.save(alertaAtivo);

                    Alerta novoAlerta = Alerta.builder()
                            .regiao(sensor.getRegiao())
                            .sensor(sensor)
                            .medicaoOrigem(medicao)
                            .medicaoUltima(medicao)
                            .nivel(nivelDetectado)
                            .status(StatusAlerta.ATIVO)
                            .titulo(gerarTitulo(sensor, nivelDetectado))
                            .descricao(gerarDescricao(sensor, medicao, nivelDetectado))
                            .ativo(true)
                            .dataEmissao(medicao.getDataHora())
                            .dataUltimaOcorrencia(medicao.getDataHora())
                            .build();
                    alertaResultante = alertaRepository.save(novoAlerta);
                }
            }
        }

        // 4. Recálculo do Risco Regional (sempre considerando todos os sensores ativos)
        recalcularRiscoRegiao(sensor.getRegiao());

        return alertaResultante;
    }

    /**
     * Recalcula o nível de risco consolidado da região considerando TODOS os sensores ativos.
     * O risco da região corresponde ao MAIOR nível de risco entre os sensores ativos.
     * Se nenhum sensor ativo indicar risco, a região é definida como NORMAL.
     */
    @Transactional
    public void recalcularRiscoRegiao(Regiao regiao) {
        List<Sensor> sensoresAtivos = sensorRepository.findByRegiaoIdAndAtivoTrue(regiao.getId());

        NivelRisco maiorRisco = NivelRisco.NORMAL;

        for (Sensor s : sensoresAtivos) {
            Optional<Alerta> alertaAtivo = alertaRepository.findFirstBySensorIdAndAtivoTrue(s.getId());
            if (alertaAtivo.isPresent()) {
                maiorRisco = NivelRisco.maiorRisco(maiorRisco, alertaAtivo.get().getNivel());
            }
        }

        regiao.setNivelRiscoAtual(maiorRisco);
        regiaoRepository.save(regiao);
    }

    @Transactional
    public AlertaResponse resolverManualmente(Long alertaId) {
        Alerta alerta = alertaRepository.findById(alertaId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado com ID: " + alertaId));

        if (!alerta.getAtivo()) {
            throw new RegraNegocioException("Este alerta já se encontra encerrado.");
        }

        alerta.resolverManualmente(LocalDateTime.now());
        Alerta salvo = alertaRepository.save(alerta);

        // Recalcula risco da região após a resolução manual
        recalcularRiscoRegiao(alerta.getRegiao());

        return AlertaResponse.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public AlertaResponse buscarPorId(Long id) {
        Alerta alerta = alertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado com ID: " + id));
        return AlertaResponse.fromEntity(alerta);
    }

    @Transactional(readOnly = true)
    public Page<AlertaResponse> listarComFiltros(
        Long regiaoId,
        Long sensorId,
        NivelRisco nivel,
        Boolean ativo,
        LocalDateTime dataInicio,
        LocalDateTime dataFim,
        Pageable pageable
    ) {
        Page<Alerta> pagina = alertaRepository.findComFiltros(
            regiaoId, sensorId, nivel, ativo, dataInicio, dataFim, pageable
        );
        return pagina.map(AlertaResponse::fromEntity);
    }

    private String gerarTitulo(Sensor sensor, NivelRisco nivel) {
        String tipoDescricao = sensor.getTipo() == com.alertaja.enums.TipoSensor.PLUVIOMETRO 
                ? "Chuva Intensa" 
                : "Elevação do Nível da Água";
        return String.format("[%s] %s na região de %s", nivel.name(), tipoDescricao, sensor.getRegiao().getNome());
    }

    private String gerarDescricao(Sensor sensor, Medicao medicao, NivelRisco nivel) {
        return String.format(
            "O sensor %s (%s) registrou %.2f %s, atingindo o nível de %s. Limites configurados: Atenção (%.2f %s), Alerta (%.2f %s), Perigo (%.2f %s).",
            sensor.getCodigoIdentificador(),
            sensor.getTipo(),
            medicao.getValor(),
            sensor.getUnidadeMedida(),
            nivel.name(),
            sensor.getLimiteAtencao(), sensor.getUnidadeMedida(),
            sensor.getLimiteAlerta(), sensor.getUnidadeMedida(),
            sensor.getLimitePerigo(), sensor.getUnidadeMedida()
        );
    }
}
