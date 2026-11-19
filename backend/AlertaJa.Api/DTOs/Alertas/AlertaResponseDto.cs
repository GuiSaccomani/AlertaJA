
namespace AlertaJa.Api.DTOs.Alertas
{
    public class AlertaResponseDto
    {
        public Guid Id { get; set; }

        public Guid RegiaoId { get; set; }
        public string NomeRegiao { get; set; } = string.Empty;

        public Guid SensorId { get; set; }
        public string CodigoIdentificador { get; set; } = string.Empty;

        public string Nivel { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }

        public bool Ativo { get; set; }

        public DateTime DataEmissao { get; set; }
        public DateTime? DataUltimaOcorrencia { get; set; }
        public DateTime? DataResolucao { get; set; }
    }
}
