package com.alertaja.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class SensorPropertiesTest {

    @Test
    @DisplayName("Deve validar com sucesso quando a SENSOR_INGESTION_API_KEY estiver configurada")
    void deveValidarQuandoApiKeyPresente() {
        SensorProperties properties = new SensorProperties();
        ReflectionTestUtils.setField(properties, "apiKey", "minha-chave-secreta-123");

        assertDoesNotThrow(properties::validate);
        assertEquals("minha-chave-secreta-123", properties.getApiKey());
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando a SENSOR_INGESTION_API_KEY estiver nula")
    void deveLancarExcecaoQuandoApiKeyNula() {
        SensorProperties properties = new SensorProperties();
        ReflectionTestUtils.setField(properties, "apiKey", null);

        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            properties::validate
        );

        assertTrue(exception.getMessage().contains("SENSOR_INGESTION_API_KEY"));
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando a SENSOR_INGESTION_API_KEY estiver em branco")
    void deveLancarExcecaoQuandoApiKeyEmBranco() {
        SensorProperties properties = new SensorProperties();
        ReflectionTestUtils.setField(properties, "apiKey", "   ");

        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            properties::validate
        );

        assertTrue(exception.getMessage().contains("SENSOR_INGESTION_API_KEY"));
    }
}
