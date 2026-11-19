
using AlertaJa.Api.Data;
using AlertaJa.Api.DTOs.Medicoes;
using AlertaJa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AlertaJa.Api.Services
{
    public class MedicaoService
    {
        private readonly AppDbContext _context;
private readonly AlertaService _alertaService;

public MedicaoService(
    AppDbContext context,
    AlertaService alertaService)
{
    _context = context;
    _alertaService = alertaService;
}
        //registra novas medicoes
        public async Task Receber(ReceberMedicaoDto dto)
        {
            if (dto.SensorId == Guid.Empty)
            {
                throw new ArgumentException(
                    "O identificador do sensor é inválido.");
            }

            if (dto.Valor < 0)
            {
                throw new ArgumentException(
                    "O valor da medição não pode ser negativo.");
            }

            var sensor = await _context.Sensores
                .FirstOrDefaultAsync(s => s.Id == dto.SensorId);

            if (sensor == null || !sensor.Ativo)
            {
                throw new ArgumentException(
                    "O sensor informado não existe ou está inativo.");
            }

            var agora = DateTime.Now;
 
            var medicao = new Medicao
            {
                Id = Guid.NewGuid(),
                SensorId = sensor.Id,
                Valor = dto.Valor,
                DataHora = agora,
                CriadoEm = agora
            };

            sensor.UltimaLeitura = medicao.DataHora;

            _context.Medicoes.Add(medicao);

            await _alertaService.ProcessarMedicao(
                sensor,
                medicao,
                agora
            );

            await _context.SaveChangesAsync();
        }

        //lista todas
        public async Task<List<MedicaoResponseDto>> ListarTodas()
        {
            return await _context.Medicoes
                .AsNoTracking()
                .OrderByDescending(m => m.DataHora)
                .Select(m => new MedicaoResponseDto
                {
                    Id = m.Id,
                    SensorId = m.SensorId,
                    CodigoIdentificador = m.Sensor!.CodigoIdentificador,
                    UnidadeMedida = m.Sensor!.UnidadeMedida,
                    Valor = m.Valor,
                    DataHora = m.DataHora
                })
                .ToListAsync();
        }

        //lista por id
        public async Task<MedicaoResponseDto?> ObterPorId(Guid id)
        {
            return await _context.Medicoes
                .AsNoTracking()
                .Where(m => m.Id == id)
                .Select(m => new MedicaoResponseDto
                {
                    Id = m.Id,
                    SensorId = m.SensorId,
                    CodigoIdentificador = m.Sensor!.CodigoIdentificador,
                    UnidadeMedida = m.Sensor!.UnidadeMedida,
                    Valor = m.Valor,
                    DataHora = m.DataHora
                })
                .FirstOrDefaultAsync();
        }


    }
}
