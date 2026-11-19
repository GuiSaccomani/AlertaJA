
using AlertaJa.Api.DTOs.Medicoes;
using AlertaJa.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace AlertaJa.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicoesController : ControllerBase
    {
        private readonly MedicaoService _service;
        private readonly IConfiguration _configuration;

        public MedicoesController(
            MedicaoService service,
            IConfiguration configuration)
        {   
            _service = service;
            _configuration = configuration;
        }

        private bool ValidarApiKey()
        {
            var apiKeyConfigurada = _configuration["ALERTAJA_API_KEY"];

            var apiKeyRecebida = Request.Headers["X-API-Key"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(apiKeyConfigurada) ||
                string.IsNullOrWhiteSpace(apiKeyRecebida))
            {
                return false;
            }

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(apiKeyConfigurada),
                Encoding.UTF8.GetBytes(apiKeyRecebida)
            );
        }

        [HttpGet]
        public async Task<IActionResult> ListarTodas()
        {
            var medicoes = await _service.ListarTodas();
            
            return Ok(medicoes);
        }


        [HttpGet("{id:guid}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            var medicao = await _service.ObterPorId(id);

            if (medicao == null)
            {
                return NotFound();
            }

            return Ok(medicao);
        }


        [HttpPost]
        public async Task<IActionResult> Receber(
            [FromBody] ReceberMedicaoDto dto)
        {
            if (!ValidarApiKey())
            {
                return Unauthorized("API Key inválida ou não informada.");
            }

            try
            {

                await _service.Receber(dto);

                return StatusCode(StatusCodes.Status201Created, new
                {
                    mensagem = "Medição Recebida com Sucesso."
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    mensagem = ex.Message
                });
            }
        }
    }
}
