using AlertaJa.Api.Enums;

namespace AlertaJa.Api.DTOs.Sensores
{
    public class SensorResponseDto
    {
        public Guid Id { get; set; }
        public Guid RegiaoId { get; set; }
        public string CodigoIdentificador { get; set; } = string.Empty;
        public TipoSensor Tipo { get; set; }
        public string UnidadeMedida { get; set; } = string.Empty;
        public decimal LimiteAtencao { get; set; }
        public decimal LimiteAlerta { get; set; }
        public decimal LimitePerigo { get; set; }
        public bool Ativo { get; set; }
        public DateTime? UltimaLeitura { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime? AtualizadoEm { get; set; }
    
    }
}
