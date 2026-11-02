package com.alertaja.service;

import com.alertaja.dto.RegiaoRequest;
import com.alertaja.dto.RegiaoResponse;
import com.alertaja.enums.NivelRisco;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegiaoService {

    private final RegiaoRepository regiaoRepository;
    private final SensorRepository sensorRepository;
    private final AlertaRepository alertaRepository;

    public RegiaoService(
        RegiaoRepository regiaoRepository,
        SensorRepository sensorRepository,
        AlertaRepository alertaRepository
    ) {
        this.regiaoRepository = regiaoRepository;
        this.sensorRepository = sensorRepository;
        this.alertaRepository = alertaRepository;
    }

    @Transactional
    public RegiaoResponse criar(RegiaoRequest request) {
        Regiao regiao = Regiao.builder()
                .nome(request.nome().trim())
                .cidade(request.cidade().trim())
                .estado(request.estado().trim().toUpperCase())
                .nivelRiscoAtual(NivelRisco.NORMAL)
                .ativo(true)
                .build();

        Regiao salva = regiaoRepository.save(regiao);
        return RegiaoResponse.fromEntity(salva);
    }

    @Transactional(readOnly = true)
    public RegiaoResponse buscarPorId(Long id) {
        Regiao regiao = regiaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Região não encontrada com o ID: " + id));
        return RegiaoResponse.fromEntity(regiao);
    }

    @Transactional(readOnly = true)
    public Page<RegiaoResponse> listar(Boolean incluirInativos, Pageable pageable) {
        Page<Regiao> pagina;
        if (Boolean.TRUE.equals(incluirInativos)) {
            pagina = regiaoRepository.findAll(pageable);
        } else {
            pagina = regiaoRepository.findByAtivoTrue(pageable);
        }
        return pagina.map(RegiaoResponse::fromEntity);
    }

    @Transactional
    public RegiaoResponse atualizar(Long id, RegiaoRequest request) {
        Regiao regiao = regiaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Região não encontrada com o ID: " + id));

        if (!regiao.getAtivo()) {
            throw new RegraNegocioException("Não é permitido atualizar uma região inativa. Reative-a primeiro.");
        }

        regiao.setNome(request.nome().trim());
        regiao.setCidade(request.cidade().trim());
        regiao.setEstado(request.estado().trim().toUpperCase());

        Regiao atualizada = regiaoRepository.save(regiao);
        return RegiaoResponse.fromEntity(atualizada);
    }

    @Transactional
    public void desativar(Long id) {
        Regiao regiao = regiaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Região não encontrada com o ID: " + id));

        if (!regiao.getAtivo()) {
            throw new RegraNegocioException("A região informada já se encontra inativa.");
        }

        // Executa exclusão lógica preservando o histórico de medições e alertas
        regiao.desativar();
        regiao.setNivelRiscoAtual(NivelRisco.NORMAL);

        // Desativa também os sensores vinculados a esta região inativa
        List<Sensor> sensores = sensorRepository.findByRegiaoIdAndAtivoTrue(id);
        sensores.forEach(Sensor::desativar);
        sensorRepository.saveAll(sensores);

        // Encerra eventuais alertas ativos da região
        alertaRepository.findByRegiaoIdAndAtivoTrue(id).forEach(alerta -> {
            alerta.resolverAutomaticamente(LocalDateTime.now());
            alertaRepository.save(alerta);
        });

        regiaoRepository.save(regiao);
    }

    @Transactional
    public RegiaoResponse reativar(Long id) {
        Regiao regiao = regiaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Região não encontrada com o ID: " + id));

        if (regiao.getAtivo()) {
            throw new RegraNegocioException("A região informada já se encontra ativa.");
        }

        regiao.ativar();
        Regiao reativada = regiaoRepository.save(regiao);
        return RegiaoResponse.fromEntity(reativada);
    }
}
