using AlertaJa.Api.DTOs.Sensores;
using AlertaJa.Api.Models;
using AlertaJa.Api.Repositories;

namespace AlertaJa.Api.Services
{
    public class SensorService
    {
        private readonly ISensorRepository _sensores;
        private readonly IRegiaoRepository _regioes;
        private readonly IUnitOfWork _uow;

        public SensorService(ISensorRepository sensores, IRegiaoRepository regioes, IUnitOfWork uow)
        {
            _sensores = sensores;
            _regioes = regioes;
            _uow = uow;
        }

        private static SensorResponseDto ParaDto(Sensor s) => new()
        {
            Id = s.Id,
            RegiaoId = s.RegiaoId,
            CodigoIdentificador = s.CodigoIdentificador,
            Tipo = s.Tipo,
            UnidadeMedida = s.UnidadeMedida,
            LimiteAtencao = s.LimiteAtencao,
            LimiteAlerta = s.LimiteAlerta,
            LimitePerigo = s.LimitePerigo,
            Ativo = s.Ativo,
            UltimaLeitura = s.UltimaLeitura,
            CriadoEm = s.CriadoEm,
            AtualizadoEm = s.AtualizadoEm
        };

        // Regras comuns ao cadastro e à atualização
        private async Task ValidarAsync(Guid regiaoId, decimal atencao, decimal alerta, decimal perigo)
        {
            var regiao = await _regioes.ObterPorIdAsync(regiaoId);
            if (regiao == null || !regiao.Ativo)
            {
                throw new ArgumentException(
                    "A região informada não existe ou está inativa");
            }

            if (atencao >= alerta || alerta >= perigo)
            {
                throw new ArgumentException(
                    "Os limites devem seguir a ordem: atenção < alerta < perigo");
            }
        }

        //listar todos os sensores
        public async Task<List<SensorResponseDto>> ListarTodos() =>
            (await _sensores.ListarAsync()).Select(ParaDto).ToList();

        // listar sensor por id
        public async Task<SensorResponseDto?> ObterPorId(Guid id)
        {
            var sensor = await _sensores.ObterPorIdAsync(id);
            return sensor == null ? null : ParaDto(sensor);
        }

        // res - sensor após cadastro
        public async Task<SensorResponseDto> Criar(CriarSensorDto dto)
        {
            await ValidarAsync(dto.RegiaoId, dto.LimiteAtencao, dto.LimiteAlerta, dto.LimitePerigo);

            // [CORREÇÃO QA] código duplicado estourava a UNIQUE do Oracle (HTTP 500)
            var codigo = dto.CodigoIdentificador.Trim();
            if (await _sensores.ExisteCodigoAsync(codigo))
            {
                throw new InvalidOperationException(
                    $"Já existe um sensor com o código '{codigo}'.");
            }

            var sensor = new Sensor
            {
                RegiaoId = dto.RegiaoId,
                CodigoIdentificador = codigo,
                Tipo = dto.Tipo,
                UnidadeMedida = dto.UnidadeMedida.Trim(),
                LimiteAtencao = dto.LimiteAtencao,
                LimiteAlerta = dto.LimiteAlerta,
                LimitePerigo = dto.LimitePerigo,
                CriadoEm = DateTime.Now
            };

            _sensores.Adicionar(sensor);
            await _uow.SalvarAsync();

            return ParaDto(sensor);
        }

        // res - sensor após atualizacao
        public async Task<SensorResponseDto?> Atualizar(Guid id, AtualizarSensorDto dto)
        {
            var sensor = await _sensores.ObterPorIdAsync(id);

            if (sensor == null)
            {
                return null;
            }

            await ValidarAsync(dto.RegiaoId, dto.LimiteAtencao, dto.LimiteAlerta, dto.LimitePerigo);

            // [CORREÇÃO QA] impede trocar para um código já usado por outro sensor
            var novoCodigo = dto.CodigoIdentificador.Trim();
            if (await _sensores.ExisteCodigoAsync(novoCodigo, id))
            {
                throw new InvalidOperationException(
                    $"Já existe um sensor com o código '{novoCodigo}'.");
            }

            sensor.RegiaoId = dto.RegiaoId;
            sensor.CodigoIdentificador = novoCodigo;
            sensor.Tipo = dto.Tipo;
            sensor.UnidadeMedida = dto.UnidadeMedida.Trim();
            sensor.LimiteAtencao = dto.LimiteAtencao;
            sensor.LimiteAlerta = dto.LimiteAlerta;
            sensor.LimitePerigo = dto.LimitePerigo;
            sensor.Ativo = dto.Ativo;
            sensor.AtualizadoEm = DateTime.Now;

            await _uow.SalvarAsync();

            return ParaDto(sensor);
        }
    }
}
