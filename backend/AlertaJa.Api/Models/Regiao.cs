namespace AlertaJa.Api.Models
{
    public class Regiao
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Nome { get; set; }
        public string Cidade { get; set; }
        public string Estado { get; set; }
        public string NivelRiscoAtual { get; set; } = "NORMAL";
        public bool Ativo { get; set; } = true;
        public DateTime CriadoEm { get; set; }
        public DateTime? AtualizadoEm { get; set; }

        // Relacionamentos
        public ICollection<Sensor> Sensores { get; set; } = new List<Sensor>();
        public ICollection<Alerta> Alertas { get; set; } = new List<Alerta>();
    }
}