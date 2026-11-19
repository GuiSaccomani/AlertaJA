namespace AlertaJa.Api.Models
{
    public class Alerta
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid RegiaoId { get; set; }
        public Guid SensorId { get; set; }
        public Guid MedicaoOrigemId { get; set; }
        public Guid? MedicaoUltimaId { get; set; }
        public string Nivel { get; set; } = string.Empty;
        public string Status { get; set; } = "ATIVO";
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; } = true;
        public DateTime DataEmissao { get; set; }
        public DateTime? DataUltimaOcorrencia { get; set; }
        public DateTime? DataResolucao { get; set; }

        // Relacionamentos
        public Regiao? Regiao { get; set; }
        public Sensor? Sensor { get; set; }
        public Medicao? MedicaoOrigem { get; set; }
        public Medicao? MedicaoUltima { get; set; }
    }
}