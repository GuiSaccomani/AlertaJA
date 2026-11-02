package com.alertaja.model;

import com.alertaja.enums.NivelRisco;
import com.alertaja.enums.StatusAlerta;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "alertas",
    indexes = {
        @Index(name = "idx_alertas_regiao_ativo", columnList = "regiao_id, ativo"),
        @Index(name = "idx_alertas_sensor_ativo", columnList = "sensor_id, ativo"),
        @Index(name = "idx_alertas_status", columnList = "status"),
        @Index(name = "idx_alertas_emissao", columnList = "data_emissao DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "regiao_id", nullable = false, foreignKey = @ForeignKey(name = "fk_alertas_regiao"))
    private Regiao regiao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sensor_id", nullable = false, foreignKey = @ForeignKey(name = "fk_alertas_sensor"))
    private Sensor sensor;

    /**
     * Medição original que disparou a abertura deste alerta (rastreabilidade estrita).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medicao_origem_id", nullable = false, foreignKey = @ForeignKey(name = "fk_alertas_medicao_origem"))
    private Medicao medicaoOrigem;

    /**
     * Medição mais recente que manteve este alerta em estado ativo (evita duplicidade).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicao_ultima_id", foreignKey = @ForeignKey(name = "fk_alertas_medicao_ultima"))
    private Medicao medicaoUltima;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NivelRisco nivel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatusAlerta status = StatusAlerta.ATIVO;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "data_emissao", nullable = false)
    private LocalDateTime dataEmissao;

    @Column(name = "data_ultima_ocorrencia")
    private LocalDateTime dataUltimaOcorrencia;

    @Column(name = "data_resolucao")
    private LocalDateTime dataResolucao;

    @PrePersist
    protected void onCreate() {
        if (dataEmissao == null) {
            dataEmissao = LocalDateTime.now();
        }
        if (dataUltimaOcorrencia == null) {
            dataUltimaOcorrencia = dataEmissao;
        }
        if (ativo == null) {
            ativo = true;
        }
        if (status == null) {
            status = StatusAlerta.ATIVO;
        }
    }

    public void atualizarUltimaOcorrencia(Medicao novaMedicao) {
        this.medicaoUltima = novaMedicao;
        this.dataUltimaOcorrencia = novaMedicao != null && novaMedicao.getDataHora() != null 
                ? novaMedicao.getDataHora() 
                : LocalDateTime.now();
    }

    public void resolverAutomaticamente(LocalDateTime data) {
        this.ativo = false;
        this.status = StatusAlerta.RESOLVIDO_AUTO;
        this.dataResolucao = data != null ? data : LocalDateTime.now();
    }

    public void resolverManualmente(LocalDateTime data) {
        this.ativo = false;
        this.status = StatusAlerta.RESOLVIDO_MANUAL;
        this.dataResolucao = data != null ? data : LocalDateTime.now();
    }
}
