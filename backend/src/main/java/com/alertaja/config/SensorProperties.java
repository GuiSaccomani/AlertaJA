package com.alertaja.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SensorProperties {

    @Value("${alertaja.sensor.api-key}")
    private String apiKey;

    @PostConstruct
    public void validate() {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException(
                "ERRO CRÍTICO DE SEGURANÇA: A variável de ambiente 'SENSOR_INGESTION_API_KEY' é obrigatória " +
                "e não foi configurada. Defina a variável antes de iniciar a aplicação AlertaJá."
            );
        }
    }

    public String getApiKey() {
        return apiKey;
    }
}
