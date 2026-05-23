using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;

namespace BMIS;

public class AppDbContext : DbContext {
    public DbSet<Resident> Residents { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<HouseHold> HouseHolds { get; set; } 
    public DbSet<Deceased> Deaths { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void ConfigureConventions(ModelConfigurationBuilder builder) {
        base.ConfigureConventions(builder);

        builder.Conventions.Add(_ => new GuidV7Convention());
    }
}
