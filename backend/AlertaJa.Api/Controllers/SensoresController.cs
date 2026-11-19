using AlertaJa.Api.DTOs.Sensores;
using AlertaJa.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlertaJa.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SensoresController : ControllerBase
    {
        private readonly SensorService _service;

        public SensoresController(SensorService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> ListarTodos()
        {
            var sensores = await _service.ListarTodos();

            return Ok(sensores);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            var sensor = await _service.ObterPorId(id);

            if (sensor == null)
            {
                return NotFound();
            }

            return Ok(sensor);
        }

        [HttpPost]
        [Authorize(Roles = "ROLE_ADMIN")]
        public async Task<IActionResult> Criar(CriarSensorDto dto)
        {
            // [CORREÇÃO QA] exceções de regra de negócio viravam HTTP 500
            try
            {
                var sensor = await _service.Criar(dto);

                return CreatedAtAction(
                    nameof(ObterPorId),
                    new { id = sensor.Id },
                    sensor
                    );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "ROLE_ADMIN")]
        public async Task<IActionResult> Atualizar(Guid id, AtualizarSensorDto dto)
        {
            try
            {
                var sensor = await _service.Atualizar(id, dto);

                if (sensor == null)
                {
                    return NotFound();
                }

                return Ok(sensor);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { mensagem = ex.Message });
            }
        }
    }
}
