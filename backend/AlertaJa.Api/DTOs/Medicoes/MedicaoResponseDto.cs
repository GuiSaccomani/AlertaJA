
namespace AlertaJa.Api.DTOs.Medicoes
{
    public class MedicaoResponseDto
    {
        public Guid Id { get; set; }
        public Guid SensorId { get; set; }
        public string CodigoIdentificador { get; set; } = string.Empty;
        public string UnidadeMedida { get; set; } = string.Empty;
        public decimal Valor { get; set; }
        public DateTime DataHora { get; set; }
    }
}
