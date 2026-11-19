
using Microsoft.EntityFrameworkCore;
using AlertaJa.Api.Models;

namespace AlertaJa.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Regiao> Regioes { get; set; }
        public DbSet<Sensor> Sensores { get; set; }
        public DbSet<Medicao> Medicoes { get; set; }
        public DbSet<Alerta> Alertas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // USUARIOS
            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.ToTable("USUARIOS");

                entity.HasKey(u => u.Id);

                entity.Property(u => u.Id)
                    .HasColumnName("ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .ValueGeneratedNever();

                entity.Property(u => u.Nome)
                    .HasColumnName("NOME")
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(u => u.Email)
                    .HasColumnName("EMAIL")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(u => u.Senha)
                    .HasColumnName("SENHA")
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(u => u.Role)
                    .HasColumnName("ROLE")
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(u => u.CriadoEm)
                    .HasColumnName("CRIADO_EM")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP")
                    .IsRequired();
            });

            // REGIOES
            modelBuilder.Entity<Regiao>(entity =>
            {
                entity.ToTable("REGIOES");

                entity.HasKey(r => r.Id);

                entity.Property(r => r.Id)
                    .HasColumnName("ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion(
                        id => id.ToString(),
                        value => Guid.Parse(value))
                    .ValueGeneratedNever();

                entity.Property(r => r.Nome)
                    .HasColumnName("NOME")
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(r => r.Cidade)
                    .HasColumnName("CIDADE")
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(r => r.Estado)
                    .HasColumnName("ESTADO")
                    .HasMaxLength(2)
                    .IsRequired();

                entity.Property(r => r.NivelRiscoAtual)
                    .HasColumnName("NIVEL_RISCO_ATUAL")
                    .HasMaxLength(20)
                    .HasDefaultValue("NORMAL");

                entity.Property(r => r.Ativo)
                    .HasColumnName("ATIVO")
                    .HasColumnType("NUMBER(1)")
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.Property(r => r.CriadoEm)
                    .HasColumnName("CRIADO_EM")
                    .HasColumnType("TIMESTAMP");

                entity.Property(r => r.AtualizadoEm)
                    .HasColumnName("ATUALIZADO_EM")
                    .HasColumnType("TIMESTAMP");
            });

            // SENSORES
            modelBuilder.Entity<Sensor>(entity =>
            {
                entity.ToTable("SENSORES");

                entity.HasKey(s => s.Id);

                entity.Property(s => s.Id)
                    .HasColumnName("ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .ValueGeneratedNever();

                entity.Property(s => s.CodigoIdentificador)
                    .HasColumnName("CODIGO_IDENTIFICADOR")
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(s => s.RegiaoId)
                    .HasColumnName("REGIAO_ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(s => s.Tipo)
                    .HasColumnName("TIPO")
                    .HasMaxLength(20)
                    .HasConversion<string>();

                entity.Property(s => s.UnidadeMedida)
                    .HasColumnName("UNIDADE_MEDIDA")
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(s => s.LimiteAtencao)
                    .HasColumnName("LIMITE_ATENCAO")
                    .HasColumnType("NUMBER(10,2)")
                    .IsRequired();

                entity.Property(s => s.LimiteAlerta)
                    .HasColumnName("LIMITE_ALERTA")
                    .HasColumnType("NUMBER(10,2)")
                    .IsRequired();

                entity.Property(s => s.LimitePerigo)
                    .HasColumnName("LIMITE_PERIGO")
                    .HasColumnType("NUMBER(10,2)")
                    .IsRequired();

                entity.Property(s => s.Ativo)
                    .HasColumnName("ATIVO")
                    .HasColumnType("NUMBER(1)")
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.Property(s => s.UltimaLeitura)
                    .HasColumnName("ULTIMA_LEITURA")
                    .HasColumnType("TIMESTAMP");

                entity.Property(s => s.CriadoEm)
                    .HasColumnName("CRIADO_EM")
                    .HasColumnType("TIMESTAMP")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(s => s.AtualizadoEm)
                    .HasColumnName("ATUALIZADO_EM")
                    .HasColumnType("TIMESTAMP");

                entity.HasIndex(s => s.CodigoIdentificador)
                    .IsUnique();

                entity.HasOne(s => s.Regiao)
                    .WithMany(r => r.Sensores)
                    .HasForeignKey(s => s.RegiaoId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // MEDICOES
            modelBuilder.Entity<Medicao>(entity =>
            {
                entity.ToTable("MEDICOES");

                entity.HasKey(m => m.Id);

                entity.Property(m => m.Id)
                    .HasColumnName("ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .ValueGeneratedNever();

                entity.Property(m => m.SensorId)
                    .HasColumnName("SENSOR_ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(m => m.Valor)
                    .HasColumnName("VALOR")
                    .HasColumnType("NUMBER(10,2)")
                    .IsRequired();

                entity.Property(m => m.DataHora)
                    .HasColumnName("DATA_HORA")
                    .HasColumnType("TIMESTAMP")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(m => m.CriadoEm)
                    .HasColumnName("CRIADO_EM")
                    .HasColumnType("TIMESTAMP")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(m => m.Sensor)
                    .WithMany(s => s.Medicoes)
                    .HasForeignKey(m => m.SensorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ALERTAS
            modelBuilder.Entity<Alerta>(entity =>
            {
                entity.ToTable("ALERTAS");

                entity.HasKey(a => a.Id);

                entity.Property(a => a.Id)
                    .HasColumnName("ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .ValueGeneratedNever();

                entity.Property(a => a.RegiaoId)
                    .HasColumnName("REGIAO_ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(a => a.SensorId)
                    .HasColumnName("SENSOR_ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(a => a.MedicaoOrigemId)
                    .HasColumnName("MEDICAO_ORIGEM_ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(a => a.MedicaoUltimaId)
                    .HasColumnName("MEDICAO_ULTIMA_ID")
                    .HasColumnType("VARCHAR2(36)")
                    .HasConversion<string>();

                entity.Property(a => a.Nivel)
                    .HasColumnName("NIVEL")
                    .HasColumnType("VARCHAR2(20)")
                    .IsRequired();

                entity.Property(a => a.Status)
                    .HasColumnName("STATUS")
                    .HasMaxLength(20)
                    .HasDefaultValue("ATIVO")
                    .IsRequired();

                entity.Property(a => a.Titulo)
                    .HasColumnName("TITULO")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(a => a.Descricao)
                    .HasColumnName("DESCRICAO")
                    .HasColumnType("CLOB");

                entity.Property(a => a.Ativo)
                    .HasColumnName("ATIVO")
                    .HasColumnType("NUMBER(1)")
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.Property(a => a.DataEmissao)
                    .HasColumnName("DATA_EMISSAO")
                    .HasColumnType("TIMESTAMP")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(a => a.DataUltimaOcorrencia)
                    .HasColumnName("DATA_ULTIMA_OCORRENCIA")
                    .HasColumnType("TIMESTAMP");

                entity.Property(a => a.DataResolucao)
                    .HasColumnName("DATA_RESOLUCAO")
                    .HasColumnType("TIMESTAMP");

                entity.HasOne(a => a.Regiao)
                    .WithMany(r => r.Alertas)
                    .HasForeignKey(a => a.RegiaoId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Sensor)
                    .WithMany(s => s.Alertas)
                    .HasForeignKey(a => a.SensorId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.MedicaoOrigem)
                    .WithMany()
                    .HasForeignKey(a => a.MedicaoOrigemId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.MedicaoUltima)
                    .WithMany()
                    .HasForeignKey(a => a.MedicaoUltimaId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
