using AlertaJa.Api.Models;

namespace AlertaJa.Api.Repositories
{
    // Camada Repository: isola o acesso a dados (Entity Framework Core + Oracle)
    // das regras de negócio. Os Services dependem apenas destas interfaces.

    /// <summary>Grava, numa única transação, todas as alterações feitas pelos repositórios.</summary>
    public interface IUnitOfWork
    {
        Task<int> SalvarAsync();
    }

    public interface IUsuarioRepository
    {
        Task<Usuario?> ObterPorEmailAsync(string email);
    }

    public interface IRegiaoRepository
    {
        Task<List<Regiao>> ListarAsync();
        Task<Regiao?> ObterPorIdAsync(Guid id);
        Task<Regiao?> ObterComAlertasAsync(Guid id);
        void Adicionar(Regiao regiao);
    }

    public interface ISensorRepository
    {
        Task<List<Sensor>> ListarAsync();
        Task<Sensor?> ObterPorIdAsync(Guid id);
        Task<bool> ExisteCodigoAsync(string codigo, Guid? ignorarId = null);
        void Adicionar(Sensor sensor);
    }

    public interface IMedicaoRepository
    {
        Task<List<Medicao>> ListarAsync();
        Task<Medicao?> ObterPorIdAsync(Guid id);
        void Adicionar(Medicao medicao);
    }

    public interface IAlertaRepository
    {
        Task<List<Alerta>> ListarAsync();
        Task<Alerta?> ObterPorIdAsync(Guid id);
        void Remover(Alerta alerta);
    }
}
