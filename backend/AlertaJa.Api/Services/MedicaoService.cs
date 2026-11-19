using AlertaJa.Api.DTOs.Medicoes;
using AlertaJa.Api.Models;
using AlertaJa.Api.Repositories;

namespace AlertaJa.Api.Services
{
    public class MedicaoService
    {
        private readonly IMedicaoRepository _medicoes;
        private readonly ISensorRepository _sensores;
        private readonly IUnitOfWork _uow;
        private readonly AlertaService _alertaService;

        public MedicaoService(
            IMedicaoRepository medicoes,
            ISensorRepository sensores,
            IUnitOfWork uow,
            AlertaService alertaService)
        {
            _medicoes = medicoes;
            _sensores = sensores;
            _uow = uow;
            _alertaService = alertaService;
        }

        private static MedicaoResponseDto ParaDto(Medicao m) => new()
        {
            Id = m.Id,
            SensorId = m.SensorId,
            CodigoIdentificador = m.Sensor?.CodigoIdentificador ?? string.Empty,
            UnidadeMedida = m.Sensor?.UnidadeMedida ?? string.Empty,
            Valor = m.Valor,
            DataHora = m.DataHora
        };

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

            var sensor = await _sensores.ObterPorIdAsync(dto.SensorId);

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

            _medicoes.Adicionar(medicao);

            await _alertaService.ProcessarMedicao(sensor, medicao, agora);

            // medição, alerta e risco da região gravados na mesma transação
            await _uow.SalvarAsync();
        }

        //lista todas
        public async Task<List<MedicaoResponseDto>> ListarTodas() =>
            (await _medicoes.ListarAsync()).Select(ParaDto).ToList();

        //lista por id
        public async Task<MedicaoResponseDto?> ObterPorId(Guid id)
        {
            var medicao = await _medicoes.ObterPorIdAsync(id);
            return medicao == null ? null : ParaDto(medicao);
        }
    }
}
