using System.ComponentModel.DataAnnotations;

namespace AlertaJa.Api.DTOs.Regioes
{
    public class CriarRegiaoDto
    {
        [Required(ErrorMessage = "O nome da regiao é obrigatório.")]
        [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "A cidade é obrigatória.")]
        [MaxLength(100, ErrorMessage = "A cidade deve ter no máximo 100 caracteres.")]
        public string Cidade { get; set; } = string.Empty;

        [Required(ErrorMessage = "O estado é obrigatório.")]
        [StringLength(2, MinimumLength = 2, ErrorMessage = "O estado deve possuir exatamente 2 caracteres.")]
        public string Estado { get; set; } = string.Empty;

     }
}
