using AlertaJa.Api.DTOs.Regioes;
using AlertaJa.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlertaJa.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RegioesController : ControllerBase
    {
        private readonly RegiaoService _service;

        public RegioesController(RegiaoService service)
        {
            _service = service;

        }

        [HttpGet]
        public async Task<IActionResult> ListarTodas() 
        {
            var regioes = await _service.ListarTodas();

            return Ok(regioes);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            var regiao = await _service.ObterPorId(id);
        
            if (regiao == null)
            {
                return NotFound();
            }

            return Ok(regiao);
        }

        [HttpPost]
        [Authorize(Roles = "ROLE_ADMIN")]
        public async Task<IActionResult> Criar(CriarRegiaoDto dto)
        {
            var regiao = await _service.Criar(dto);

            return CreatedAtAction(
                nameof(ObterPorId),
                new { id = regiao.Id },
                regiao
            );
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "ROLE_ADMIN")]
        public async Task<IActionResult> Atualizar(Guid id, AtualizarRegiaoDto dto)
        {
            var regiao = await _service.Atualizar(id, dto);

            if (regiao == null)
            {
                return NotFound();

            }

            return Ok(regiao);
        }
    }
}
