using AlertaJa.Api.Data;
using AlertaJa.Api.DTOs.Sensores;
using AlertaJa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AlertaJa.Api.Services
{
    public class SensorService
    {
        private readonly AppDbContext _context;

        public SensorService(AppDbContext context)
        {
            _context = context;
        }

        //listar todos os sensores
        public async Task<List<SensorResponseDto>> ListarTodos()
        {
            return await _context.Sensores
                .AsNoTracking()
                .Select(s => new SensorResponseDto
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

                })
                .ToListAsync();
        }

        // listar sensor por id

        public async Task<SensorResponseDto?> ObterPorId(Guid id)
        {
            return await _context.Sensores
                .AsNoTracking()
                .Where(s => s.Id == id)
                .Select(s => new SensorResponseDto
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
                })
                .FirstOrDefaultAsync();
        }

        // res - sensor após cadastro
        public async Task<SensorResponseDto> Criar(CriarSensorDto dto)
        {
            var regiao = await _context.Regioes
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == dto.RegiaoId);

            if (regiao == null || !regiao.Ativo)
            {
                throw new ArgumentException(
                    "A região informada não existe ou está inativa");
            }

            if (dto.LimiteAtencao >= dto.LimiteAlerta ||
                    dto.LimiteAlerta >= dto.LimitePerigo)
            {
                throw new ArgumentException(
                    "Os limites devem seguir a ordem: atenção < alerta < perigo");
            }

            // [CORREÇÃO QA] código duplicado estourava a UNIQUE do Oracle (HTTP 500)
            var codigo = dto.CodigoIdentificador.Trim();
            // CountAsync em vez de AnyAsync: o provedor Oracle gera "THEN True" (só aceito no 23ai)
            if (await _context.Sensores.CountAsync(s => s.CodigoIdentificador == codigo) > 0)
            {
                throw new InvalidOperationException(
                    $"Já existe um sensor com o código '{codigo}'.");
            }

            var sensor = new Sensor
            {
                RegiaoId = dto.RegiaoId,
                CodigoIdentificador = dto.CodigoIdentificador.Trim(),
                Tipo = dto.Tipo,
                UnidadeMedida = dto.UnidadeMedida.Trim(),
                LimiteAtencao = dto.LimiteAtencao,
                LimiteAlerta = dto.LimiteAlerta,
                LimitePerigo = dto.LimitePerigo,
            };

            _context.Sensores.Add(sensor);

            await _context.SaveChangesAsync();

            return await _context.Sensores
                .AsNoTracking()
                .Where(s => s.Id == sensor.Id)
                .Select(s => new SensorResponseDto
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
                })
                .FirstAsync();
        }

        // res - sensor após atualizacao
        public async Task<SensorResponseDto?> Atualizar(Guid id, AtualizarSensorDto dto)
        {


            var sensor = await _context.Sensores
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sensor == null)
            {
                return null;
            }

            var regiao = await _context.Regioes
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == dto.RegiaoId);

            if (regiao == null || !regiao.Ativo)
            {
                throw new ArgumentException(
                    "A região informada não existe ou está inativa");
            }

            if (dto.LimiteAtencao >= dto.LimiteAlerta ||
                    dto.LimiteAlerta >= dto.LimitePerigo)
            {
                throw new ArgumentException(
                    "Os limites devem seguir a ordem: atenção < alerta < perigo");
            }


            // [CORREÇÃO QA] impede trocar para um código já usado por outro sensor
            var novoCodigo = dto.CodigoIdentificador.Trim();
            if (await _context.Sensores.CountAsync(s => s.Id != id && s.CodigoIdentificador == novoCodigo) > 0)
            {
                throw new InvalidOperationException(
                    $"Já existe um sensor com o código '{novoCodigo}'.");
            }

            sensor.RegiaoId = dto.RegiaoId;
            sensor.CodigoIdentificador = dto.CodigoIdentificador.Trim();
            sensor.Tipo = dto.Tipo;
            sensor.UnidadeMedida = dto.UnidadeMedida.Trim();
            sensor.LimiteAtencao = dto.LimiteAtencao;
            sensor.LimiteAlerta = dto.LimiteAlerta;
            sensor.LimitePerigo = dto.LimitePerigo;
            sensor.Ativo = dto.Ativo;
            sensor.AtualizadoEm = DateTime.Now;

            await _context.SaveChangesAsync();

            return new SensorResponseDto
            {
                Id = sensor.Id,
                RegiaoId = sensor.RegiaoId,
                CodigoIdentificador = sensor.CodigoIdentificador,
                Tipo = sensor.Tipo,
                UnidadeMedida = sensor.UnidadeMedida,
                LimiteAtencao = sensor.LimiteAtencao,
                LimiteAlerta = sensor.LimiteAlerta,
                LimitePerigo = sensor.LimitePerigo,
                Ativo = sensor.Ativo,
                UltimaLeitura = sensor.UltimaLeitura,
                CriadoEm = sensor.CriadoEm,
                AtualizadoEm = sensor.AtualizadoEm
            };
        }
    }
}
