using AlertaJa.Api.DTOs.Alertas;
using AlertaJa.Api.Models;
using AlertaJa.Api.Repositories;

namespace AlertaJa.Api.Services
{
    public class AlertaService
    {
        private readonly IAlertaRepository _alertas;
        private readonly IRegiaoRepository _regioes;
        private readonly IUnitOfWork _uow;

        public AlertaService(IAlertaRepository alertas, IRegiaoRepository regioes, IUnitOfWork uow)
        {
            _alertas = alertas;
            _regioes = regioes;
            _uow = uow;
        }

        private static string ClassificarNivel(decimal valor, Sensor sensor)
        {
            if (valor >= sensor.LimitePerigo)
                return "PERIGO";

            if (valor >= sensor.LimiteAlerta)
                return "ALERTA";

            if (valor >= sensor.LimiteAtencao)
                return "ATENCAO";

            return "NORMAL";
        }

        // Classifica a medição, abre/atualiza/resolve o alerta do sensor e
        // recalcula o risco da região. A gravação fica a cargo de quem chama
        // (MedicaoService), para que tudo vá numa única transação.
        public async Task ProcessarMedicao(Sensor sensor, Medicao medicao, DateTime agora)
        {
            var nivel = ClassificarNivel(medicao.Valor, sensor);

            var regiao = await _regioes.ObterComAlertasAsync(sensor.RegiaoId);

            if (regiao == null)
                throw new InvalidOperationException(
                    "A região vinculada ao sensor não foi encontrada.");

            regiao.AtualizadoEm = agora;

            var alerta = regiao.Alertas
                .FirstOrDefault(a => a.SensorId == sensor.Id && a.Ativo);

            if (nivel == "NORMAL")
            {
                if (alerta != null)
                {
                    alerta.Ativo = false;
                    alerta.Status = "RESOLVIDO_AUTO";
                    alerta.DataResolucao = agora;
                    alerta.MedicaoUltimaId = medicao.Id;
                    alerta.DataUltimaOcorrencia = agora;
                }
            }
            else
            {
                if (alerta == null)
                {
                    alerta = new Alerta
                    {
                        Id = Guid.NewGuid(),
                        RegiaoId = regiao.Id,
                        SensorId = sensor.Id,
                        MedicaoOrigemId = medicao.Id,
                        MedicaoUltimaId = medicao.Id,
                        Nivel = nivel,
                        Status = "ATIVO",
                        Ativo = true,
                        Titulo = $"Alerta de {nivel.ToLower()}",
                        DataEmissao = agora,
                        DataUltimaOcorrencia = agora
                    };

                    regiao.Alertas.Add(alerta);
                }
                else
                {
                    alerta.Nivel = nivel;
                    alerta.Status = "ATIVO";
                    alerta.Ativo = true;
                    alerta.MedicaoUltimaId = medicao.Id;
                    alerta.DataUltimaOcorrencia = agora;
                    alerta.Titulo = $"Alerta de {nivel.ToLower()}";
                }
            }

            regiao.NivelRiscoAtual = CalcularRiscoRegiao(regiao.Alertas);
        }

        private static string CalcularRiscoRegiao(IEnumerable<Alerta> alertas)
        {
            var niveis = alertas
                .Where(a => a.Ativo)
                .Select(a => a.Nivel);

            if (niveis.Contains("PERIGO"))
                return "PERIGO";

            if (niveis.Contains("ALERTA"))
                return "ALERTA";

            if (niveis.Contains("ATENCAO"))
                return "ATENCAO";

            return "NORMAL";
        }

        private static AlertaResponseDto ParaDto(Alerta a) => new()
        {
            Id = a.Id,
            RegiaoId = a.RegiaoId,
            NomeRegiao = a.Regiao?.Nome ?? string.Empty,
            SensorId = a.SensorId,
            CodigoIdentificador = a.Sensor?.CodigoIdentificador ?? string.Empty,
            Nivel = a.Nivel,
            Status = a.Status,
            Titulo = a.Titulo,
            Descricao = a.Descricao,
            Ativo = a.Ativo,
            DataEmissao = a.DataEmissao,
            DataUltimaOcorrencia = a.DataUltimaOcorrencia,
            DataResolucao = a.DataResolucao
        };

        //listar todos
        public async Task<List<AlertaResponseDto>> ListarTodos() =>
            (await _alertas.ListarAsync()).Select(ParaDto).ToList();

        //lista por id
        public async Task<AlertaResponseDto?> ObterPorId(Guid id)
        {
            var alerta = await _alertas.ObterPorIdAsync(id);
            return alerta == null ? null : ParaDto(alerta);
        }

        public async Task<bool> Excluir(Guid id)
        {
            var alerta = await _alertas.ObterPorIdAsync(id);

            if (alerta == null)
                return false;

            if (alerta.Ativo)
            {
                var regiao = await _regioes.ObterComAlertasAsync(alerta.RegiaoId);

                if (regiao != null)
                {
                    var alertasRestantes = regiao.Alertas.Where(a => a.Id != alerta.Id);

                    regiao.NivelRiscoAtual = CalcularRiscoRegiao(alertasRestantes);
                    regiao.AtualizadoEm = DateTime.Now;
                }
            }

            _alertas.Remover(alerta);

            await _uow.SalvarAsync();

            return true;
        }
    }
}
