package com.alertaja.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("AlertaJá - API de Monitoramento e Emissão de Alertas")
                .version("1.0.0")
                .description("""
                    ### ⚠️ AVISO IMPORTANTE: AMBIENTE DE SIMULAÇÃO EDUCATIVA
                    Esta API foi projetada para monitoramento de riscos de alagamento e emissão de alertas.
                    **Os dados de telemetria e sensores são gerados por simulação e NÃO representam medições oficiais de órgãos de defesa civil.**
                    
                    **Autenticação:**
                    * **Usuários:** Bearer Token JWT via endpoint `/api/v1/auth/login`.
                    * **Sensores / Simulador:** Header HTTP `X-Sensor-API-Key` no endpoint `/api/v1/medicoes`.
                    """)
                .contact(new Contact().name("Equipe de Desenvolvimento AlertaJá")))
            .components(new Components()
                .addSecuritySchemes("BearerAuth", new SecurityScheme()
                    .name("BearerAuth")
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Insira o token JWT gerado no login com o prefixo Bearer"))
                .addSecuritySchemes("SensorApiKeyAuth", new SecurityScheme()
                    .name("X-Sensor-API-Key")
                    .type(SecurityScheme.Type.APIKEY)
                    .in(SecurityScheme.In.HEADER)
                    .description("Chave de autenticação exclusiva para ingestão de telemetria dos sensores")))
            .addSecurityItem(new SecurityRequirement().addList("BearerAuth"));
    }
}
