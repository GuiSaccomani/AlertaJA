
using AlertaJa.Api.Enums;
using System.ComponentModel.DataAnnotations;

namespace AlertaJa.Api.DTOs.Sensores
{
    public class CriarSensorDto
    {
        public Guid RegiaoId { get; set; }

        [Required(ErrorMessage = "O código identificador é obrigatório.")]
        [MaxLength(50, ErrorMessage = "O código identificador deve ter no máximo 50 caracteres.")]
        public string CodigoIdentificador { get; set; } = string.Empty;

        [Required(ErrorMessage = "O tipo é obrigatório.")]
        public TipoSensor Tipo { get; set; }

        [Required(ErrorMessage = "A unidade de medida é obrigatória.")]
        [MaxLength(20, ErrorMessage = "A unidade de medida deve ter no máximo 20 caracteres.")]
        public string UnidadeMedida { get; set; } = string.Empty;

        [Range(typeof(decimal), "1", "999999999",
            ErrorMessage = "O valor limite para 'Atenção' deve ser maior que 1.")]
        public decimal LimiteAtencao { get; set; }

        [Range(typeof(decimal), "1", "999999999",
            ErrorMessage = "O valor limite para 'Alerta' deve ser maior que 1.")]
        public decimal LimiteAlerta { get; set; }

        [Range(typeof(decimal), "1", "999999999",
            ErrorMessage = "O valor limite para 'Perigo' deve ser maior que 1.")]
        public decimal LimitePerigo { get; set; }
    }
}
