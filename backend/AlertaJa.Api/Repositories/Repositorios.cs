using AlertaJa.Api.Data;
using AlertaJa.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AlertaJa.Api.Repositories
{
    // Implementações com Entity Framework Core. Todas compartilham o mesmo
    // AppDbContext (escopo da requisição), então as alterações de vários
    // repositórios são gravadas juntas pelo IUnitOfWork.

    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        public UnitOfWork(AppDbContext context) => _context = context;
        public Task<int> SalvarAsync() => _context.SaveChangesAsync();
    }

    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly AppDbContext _context;
        public UsuarioRepository(AppDbContext context) => _context = context;

        public Task<Usuario?> ObterPorEmailAsync(string email) =>
            _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
    }

    public class RegiaoRepository : IRegiaoRepository
    {
        private readonly AppDbContext _context;
        public RegiaoRepository(AppDbContext context) => _context = context;

        public Task<List<Regiao>> ListarAsync() =>
            _context.Regioes.AsNoTracking().ToListAsync();

        public Task<Regiao?> ObterPorIdAsync(Guid id) =>
            _context.Regioes.FirstOrDefaultAsync(r => r.Id == id);

        public Task<Regiao?> ObterComAlertasAsync(Guid id) =>
            _context.Regioes.Include(r => r.Alertas).FirstOrDefaultAsync(r => r.Id == id);

        public void Adicionar(Regiao regiao) => _context.Regioes.Add(regiao);
    }

    public class SensorRepository : ISensorRepository
    {
        private readonly AppDbContext _context;
        public SensorRepository(AppDbContext context) => _context = context;

        public Task<List<Sensor>> ListarAsync() =>
            _context.Sensores.AsNoTracking().ToListAsync();

        public Task<Sensor?> ObterPorIdAsync(Guid id) =>
            _context.Sensores.FirstOrDefaultAsync(s => s.Id == id);

        // CountAsync em vez de AnyAsync: o provedor Oracle gera "THEN True",
        // sintaxe aceita apenas no Oracle 23ai (o servidor da FIAP é 19c).
        public async Task<bool> ExisteCodigoAsync(string codigo, Guid? ignorarId = null)
        {
            var consulta = _context.Sensores.Where(s => s.CodigoIdentificador == codigo);
            if (ignorarId.HasValue)
            {
                var id = ignorarId.Value;
                consulta = consulta.Where(s => s.Id != id);
            }
            return await consulta.CountAsync() > 0;
        }

        public void Adicionar(Sensor sensor) => _context.Sensores.Add(sensor);
    }

    public class MedicaoRepository : IMedicaoRepository
    {
        private readonly AppDbContext _context;
        public MedicaoRepository(AppDbContext context) => _context = context;

        public Task<List<Medicao>> ListarAsync() =>
            _context.Medicoes.AsNoTracking()
                .Include(m => m.Sensor)
                .OrderByDescending(m => m.DataHora)
                .ToListAsync();

        public Task<Medicao?> ObterPorIdAsync(Guid id) =>
            _context.Medicoes.AsNoTracking()
                .Include(m => m.Sensor)
                .FirstOrDefaultAsync(m => m.Id == id);

        public void Adicionar(Medicao medicao) => _context.Medicoes.Add(medicao);
    }

    public class AlertaRepository : IAlertaRepository
    {
        private readonly AppDbContext _context;
        public AlertaRepository(AppDbContext context) => _context = context;

        public Task<List<Alerta>> ListarAsync() =>
            _context.Alertas.AsNoTracking()
                .Include(a => a.Regiao)
                .Include(a => a.Sensor)
                .OrderByDescending(a => a.DataEmissao)
                .ToListAsync();

        public Task<Alerta?> ObterPorIdAsync(Guid id) =>
            _context.Alertas
                .Include(a => a.Regiao)
                .Include(a => a.Sensor)
                .FirstOrDefaultAsync(a => a.Id == id);

        public void Remover(Alerta alerta) => _context.Alertas.Remove(alerta);
    }
}
