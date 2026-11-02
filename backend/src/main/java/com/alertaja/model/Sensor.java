package com.alertaja.model;

import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.TipoSensor;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "sensores",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_sensor_codigo", columnNames = "codigo_identificador")
    },
    indexes = {
        @Index(name = "idx_sensores_regiao", columnList = "regiao_id"),
        @Index(name = "idx_sensores_ativo", columnList = "ativo"),
        @Index(name = "idx_sensores_codigo", columnList = "codigo_identificador")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Sensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "regiao_id", nullable = false, foreignKey = @ForeignKey(name = "fk_sensores_regiao"))
    private Regiao regiao;

    @Column(name = "codigo_identificador", nullable = false, length = 50)
    private String codigoIdentificador;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoSensor tipo;

    @Column(name = "unidade_medida", nullable = false, length = 10)
    private String unidadeMedida;

    @Column(name = "limite_atencao", nullable = false, precision = 10, scale = 2)
    private BigDecimal limiteAtencao;

    @Column(name = "limite_alerta", nullable = false, precision = 10, scale = 2)
    private BigDecimal limiteAlerta;

    @Column(name = "limite_perigo", nullable = false, precision = 10, scale = 2)
    private BigDecimal limitePerigo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "ultima_leitura")
    private LocalDateTime ultimaLeitura;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    protected void onCreate() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (ativo == null) {
            ativo = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        atualizadoEm = LocalDateTime.now();
    }

    public void desativar() {
        this.ativo = false;
        this.atualizadoEm = LocalDateTime.now();
    }

    public void ativar() {
        this.ativo = true;
        this.atualizadoEm = LocalDateTime.now();
    }

    /**
     * Avalia o nível de risco de uma medição com base nos limiares do sensor:
     * PERIGO (>= limitePerigo), ALERTA (>= limiteAlerta), ATENCAO (>= limiteAtencao) ou NORMAL (< limiteAtencao).
     */
    public NivelRisco avaliarNivelRisco(BigDecimal valor) {
        if (valor == null) {
            return NivelRisco.NORMAL;
        }
        if (limitePerigo != null && valor.compareTo(limitePerigo) >= 0) {
            return NivelRisco.PERIGO;
        }
        if (limiteAlerta != null && valor.compareTo(limiteAlerta) >= 0) {
            return NivelRisco.ALERTA;
        }
        if (limiteAtencao != null && valor.compareTo(limiteAtencao) >= 0) {
            return NivelRisco.ATENCAO;
        }
        return NivelRisco.NORMAL;
    }
}
