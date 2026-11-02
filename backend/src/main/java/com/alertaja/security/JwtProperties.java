package com.alertaja.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;

@Configuration
public class JwtProperties {

    @Value("${alertaja.jwt.secret}")
    private String secret;

    @Value("${alertaja.jwt.expiration-hours:8}")
    private long expirationHours;

    @PostConstruct
    public void validate() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "CONFIGURAÇÃO DE SEGURANÇA INVÁLIDA: O segredo JWT deve possuir no mínimo 256 bits (32 bytes) " +
                "para garantir a segurança da assinatura HMAC-SHA256."
            );
        }
    }

    public String getSecret() {
        return secret;
    }

    public long getExpirationHours() {
        return expirationHours;
    }
}
