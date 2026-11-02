package com.alertaja.config;

import com.alertaja.security.CustomAccessDeniedHandler;
import com.alertaja.security.CustomAuthenticationEntryPoint;
import com.alertaja.security.JwtAuthenticationFilter;
import com.alertaja.security.SensorApiKeyFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SensorApiKeyFilter sensorApiKeyFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(
        CorsConfigurationSource corsConfigurationSource,
        JwtAuthenticationFilter jwtAuthenticationFilter,
        SensorApiKeyFilter sensorApiKeyFilter,
        CustomAuthenticationEntryPoint authenticationEntryPoint,
        CustomAccessDeniedHandler accessDeniedHandler
    ) {
        this.corsConfigurationSource = corsConfigurationSource;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.sensorApiKeyFilter = sensorApiKeyFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                // Documentação Swagger/OpenAPI pública
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()

                // Endpoints públicos de autenticação
                .requestMatchers(
                    "/api/v1/auth/register",
                    "/api/v1/auth/login"
                ).permitAll()

                // Dados do usuário logado
                .requestMatchers("/api/v1/auth/me").authenticated()

                // Ingestão de telemetria restrita exclusivamente a sensores autenticados via X-Sensor-API-Key
                .requestMatchers(HttpMethod.POST, "/api/v1/medicoes").hasAuthority("ROLE_SENSOR_INGESTION")

                // Rotas administrativas exclusivas para ROLE_ADMIN
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                // Qualquer outra requisição requer autenticação
                .anyRequest().authenticated()
            )
            .addFilterBefore(sensorApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
