
using AlertaJa.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AlertaJa.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlertasController : ControllerBase
    {
        private readonly AlertaService _service;

        public AlertasController(AlertaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> ListarTodas()
        {
            var alertas = await _service.ListarTodos();

            return Ok(alertas);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            var alerta = await _service.ObterPorId(id);

            if (alerta == null)
            {
                return NotFound();
            }

            return Ok(alerta);
        }


        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "ROLE_ADMIN")]
        public async Task<IActionResult> Excluir(Guid id)
        {
            var excluido = await _service.Excluir(id);

            if (!excluido)
            {
                return NotFound();
            }

            return NoContent();
        }

    }
}
