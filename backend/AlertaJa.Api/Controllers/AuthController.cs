
using AlertaJa.Api.DTOs.Auth;
using AlertaJa.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AlertaJa.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] LoginDto dto)
        {
            try
            {
                var resposta = await _authService.Login(dto);

                return Ok(resposta);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    mensagem = ex.Message
                });
            }
        }
    }
}
