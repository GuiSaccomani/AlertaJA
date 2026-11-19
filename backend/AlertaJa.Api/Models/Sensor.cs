using AlertaJa.Api.Enums;

namespace AlertaJa.Api.Models
{
    public class Sensor
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid RegiaoId { get; set; }
        public string CodigoIdentificador { get; set; } = string.Empty;
        public TipoSensor Tipo { get; set; }
        public string UnidadeMedida { get; set; } = string.Empty;
        public decimal LimiteAtencao { get; set; }
        public decimal LimiteAlerta { get; set; }
        public decimal LimitePerigo { get; set; }
        public bool Ativo { get; set; } = true;
        public DateTime? UltimaLeitura { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime? AtualizadoEm { get; set; }

        // Relacionamentos
        public Regiao? Regiao { get; set; }
        public ICollection<Medicao> Medicoes { get; set; } = new List<Medicao>();
        public ICollection<Alerta> Alertas { get; set; } = new List<Alerta>();
    }
}