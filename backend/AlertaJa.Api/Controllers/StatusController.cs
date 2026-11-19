using Microsoft.AspNetCore.Mvc;

namespace AlertaJa.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatusController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                sistema = "AlertaJá",
                status = "Online",
                versao = "1.0"
            });

        }
    }
}