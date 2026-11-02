package com.alertaja.security;

import com.alertaja.config.SensorProperties;
import com.alertaja.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class SensorApiKeyFilter extends OncePerRequestFilter {

    private final SensorProperties sensorProperties;
    private final ObjectMapper objectMapper;

    public SensorApiKeyFilter(SensorProperties sensorProperties) {
        this.sensorProperties = sensorProperties;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // O filtro atua especificamente na proteção do endpoint de ingestão de telemetria
        if (path.startsWith("/api/v1/medicoes") && "POST".equalsIgnoreCase(method)) {
            String apiKeyHeader = request.getHeader("X-Sensor-API-Key");
            String expectedApiKey = sensorProperties.getApiKey();

            if (apiKeyHeader == null || apiKeyHeader.trim().isEmpty() || !apiKeyHeader.equals(expectedApiKey)) {
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setStatus(HttpStatus.UNAUTHORIZED.value());

                ErrorResponse errorResponse = new ErrorResponse(
                    HttpStatus.UNAUTHORIZED.value(),
                    "Não Autorizado",
                    "Autenticação de telemetria falhou: cabeçalho 'X-Sensor-API-Key' ausente ou inválido.",
                    path
                );

                response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                return;
            }

            // Autentica o emissor da telemetria com permissão exclusiva de ingestão
            PreAuthenticatedAuthenticationToken authentication = new PreAuthenticatedAuthenticationToken(
                "sensor-ingestion-client",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_SENSOR_INGESTION"))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
