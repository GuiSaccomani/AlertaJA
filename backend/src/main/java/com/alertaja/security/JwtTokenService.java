package com.alertaja.security;

import com.alertaja.enums.RoleUsuario;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtTokenService {

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtTokenService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String gerarToken(Long id, String email, String nome, RoleUsuario role) {
        long agora = System.currentTimeMillis();
        long expiracao = agora + (jwtProperties.getExpirationHours() * 3600 * 1000);

        return Jwts.builder()
                .subject(email)
                .claim("id", id)
                .claim("nome", nome)
                .claim("role", role.name())
                .issuedAt(new Date(agora))
                .expiration(new Date(expiracao))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public boolean validarToken(String token) {
        try {
            obterClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String obterEmailDoToken(String token) {
        return obterClaims(token).getSubject();
    }

    public RoleUsuario obterRoleDoToken(String token) {
        String roleStr = obterClaims(token).get("role", String.class);
        return RoleUsuario.valueOf(roleStr);
    }

    public Long obterIdDoToken(String token) {
        return obterClaims(token).get("id", Long.class);
    }

    public Claims obterClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
