namespace AlertaJa.Api.Models
{
    public class Medicao
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SensorId { get; set; }
        public decimal Valor { get; set; }
        public DateTime DataHora { get; set; }
        public DateTime CriadoEm { get; set; }

        // Relacionamentos
        public Sensor? Sensor { get; set; }
    }
}