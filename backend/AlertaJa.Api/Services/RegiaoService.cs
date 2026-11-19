using AlertaJa.Api.DTOs.Regioes;
using AlertaJa.Api.Models;
using AlertaJa.Api.Repositories;

namespace AlertaJa.Api.Services
{
    public class RegiaoService
    {
        private readonly IRegiaoRepository _regioes;
        private readonly IUnitOfWork _uow;

        public RegiaoService(IRegiaoRepository regioes, IUnitOfWork uow)
        {
            _regioes = regioes;
            _uow = uow;
        }

        private static RegiaoResponseDto ParaDto(Regiao r) => new()
        {
            Id = r.Id,
            Nome = r.Nome,
            Cidade = r.Cidade,
            Estado = r.Estado,
            NivelRiscoAtual = r.NivelRiscoAtual,
            Ativo = r.Ativo, // [CORREÇÃO QA] o PUT não devolvia este campo (sempre false)
            CriadoEm = r.CriadoEm,
            AtualizadoEm = r.AtualizadoEm
        };

        // listar todas as regioes
        public async Task<List<RegiaoResponseDto>> ListarTodas() =>
            (await _regioes.ListarAsync()).Select(ParaDto).ToList();

        // listar regiao por id
        public async Task<RegiaoResponseDto?> ObterPorId(Guid id)
        {
            var regiao = await _regioes.ObterPorIdAsync(id);
            return regiao == null ? null : ParaDto(regiao);
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

            _regioes.Adicionar(regiao);
            await _uow.SalvarAsync();

            return ParaDto(regiao);
        }

        // res - regiao após atualizacao
        public async Task<RegiaoResponseDto?> Atualizar(Guid id, AtualizarRegiaoDto dto)
        {
            var regiao = await _regioes.ObterPorIdAsync(id);

            if (regiao == null)
            {
                return null;
            }

            regiao.Nome = dto.Nome.Trim();
            regiao.Cidade = dto.Cidade.Trim();
            regiao.Estado = dto.Estado.Trim().ToUpperInvariant();
            regiao.Ativo = dto.Ativo;
            regiao.AtualizadoEm = DateTime.Now;

            await _uow.SalvarAsync();

            return ParaDto(regiao);
        }
    }
}
