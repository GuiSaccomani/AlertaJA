
using AlertaJa.Api.DTOs.Auth;
using AlertaJa.Api.Models;
using Microsoft.AspNetCore.Identity;
using AlertaJa.Api.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AlertaJa.Api.Services
{
    public class AuthService
    {
        private readonly IUsuarioRepository _usuarios;
        private readonly IPasswordHasher<Usuario> _passwordHasher;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUsuarioRepository usuarios,
            IPasswordHasher<Usuario> passwordHasher,
            IConfiguration configuration)
        {
            _usuarios = usuarios;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
        }

        public async Task<LoginResponseDto> Login(LoginDto dto)
        {
            var email = dto.Email.Trim();

            var usuario = await _usuarios.ObterPorEmailAsync(email);

            if (usuario == null)
                throw new UnauthorizedAccessException(
                    "E-mail ou senha inválidos.");

            var resultado = _passwordHasher.VerifyHashedPassword(
                usuario,
                usuario.Senha,
                dto.Senha
            );

            if (resultado == PasswordVerificationResult.Failed)
                throw new UnauthorizedAccessException(
                    "E-mail ou senha inválidos.");

            var token = GerarToken(usuario);

            return new LoginResponseDto
            {
                Token = token,
                ExpiraEm = DateTime.UtcNow.AddMinutes(
                    int.Parse(_configuration["Jwt:ExpiresInMinutes"]!)
                ),
                Nome = usuario.Nome,
                Email = usuario.Email,
                Role = usuario.Role
            };
        }

        private string GerarToken(Usuario usuario)
        {
            var key = _configuration["Jwt:Key"]!;
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var expiresInMinutes = int.Parse(
                _configuration["Jwt:ExpiresInMinutes"]!
            );

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Nome),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim(ClaimTypes.Role, usuario.Role)
            };

            var signingKey = new SymmetricSecurityKey(
                Convert.FromBase64String(key)
            );

            var credentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
