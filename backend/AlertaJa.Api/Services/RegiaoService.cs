using AlertaJa.Api.Data;
using AlertaJa.Api.DTOs.Regioes;
using AlertaJa.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AlertaJa.Api.Services
{
    public class RegiaoService
    {
        private readonly AppDbContext _context;

        public RegiaoService(AppDbContext context)
        {
            _context = context;
        }

        // listar todas as regioes
        public async Task<List<RegiaoResponseDto>> ListarTodas()
        {
            return await _context.Regioes
                .AsNoTracking()
                .Select(r => new RegiaoResponseDto
                {
                    Id = r.Id,
                    Nome = r.Nome,
                    Cidade = r.Cidade,
                    Estado = r.Estado,
                    NivelRiscoAtual = r.NivelRiscoAtual,
                    Ativo = r.Ativo,
                    CriadoEm = r.CriadoEm,
                    AtualizadoEm = r.AtualizadoEm

                })
                .ToListAsync();
        }

        // listar regiao por id
        public async Task<RegiaoResponseDto?> ObterPorId(Guid id)
        {
            return await _context.Regioes
                .AsNoTracking()
                .Where(r => r.Id == id)
                .Select(r => new RegiaoResponseDto
                {
                    Id = r.Id,
                    Nome = r.Nome,
                    Cidade = r.Cidade,
                    Estado = r.Estado,
                    NivelRiscoAtual = r.NivelRiscoAtual,
                    Ativo = r.Ativo,
                    CriadoEm = r.CriadoEm,
                    AtualizadoEm = r.AtualizadoEm
                })
                .FirstOrDefaultAsync();
        }

        // res - regiao após cadastro
        public async Task<RegiaoResponseDto> Criar(CriarRegiaoDto dto)
        {
            var regiao = new Regiao
            {
                Nome = dto.Nome.Trim(),
                Cidade = dto.Cidade.Trim(),
                Estado = dto.Estado.Trim().ToUpperInvariant(),
                // [CORREÇÃO QA] sem valor explícito o EF gravava 0001-01-01 em CRIADO_EM
                CriadoEm = DateTime.Now
            };

            _context.Regioes.Add(regiao);

            await _context.SaveChangesAsync();

            return await _context.Regioes
                .AsNoTracking()
                .Where(r => r.Id == regiao.Id)
                .Select(r => new RegiaoResponseDto
                {
                    Id = r.Id,
                    Nome = r.Nome,
                    Cidade = r.Cidade,
                    Estado = r.Estado,
                    NivelRiscoAtual = r.NivelRiscoAtual,
                    Ativo = r.Ativo,
                    CriadoEm = r.CriadoEm,
                    AtualizadoEm = r.AtualizadoEm
                })
                .FirstAsync();
        }


        // res - regiao após atualizacao
        public async Task<RegiaoResponseDto?> Atualizar (Guid id, AtualizarRegiaoDto dto)
        {
            var regiao = await _context.Regioes
                .FirstOrDefaultAsync(r => r.Id == id);

            if (regiao == null)
            {
                return null;
            }

            regiao.Nome = dto.Nome.Trim();
            regiao.Cidade = dto.Cidade.Trim();
            regiao.Estado = dto.Estado.Trim().ToUpperInvariant();
            regiao.Ativo = dto.Ativo;
            regiao.AtualizadoEm = DateTime.Now;

            await _context.SaveChangesAsync();

            return new RegiaoResponseDto
            {
                Id = regiao.Id,
                Nome = regiao.Nome,
                Cidade = regiao.Cidade,
                Estado = regiao.Estado,
                NivelRiscoAtual = regiao.NivelRiscoAtual,
                Ativo = regiao.Ativo, // [CORREÇÃO QA] campo não era devolvido (sempre false)
                CriadoEm = regiao.CriadoEm,
                AtualizadoEm = regiao.AtualizadoEm
            };
        }
    }
}
