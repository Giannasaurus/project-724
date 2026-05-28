using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;

namespace BMIS;

public class AppDbContext : DbContext {
    public DbSet<Resident> Residents { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<HouseHold> HouseHolds { get; set; } 
    public DbSet<Deceased> Deaths { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<User> Users{ get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder builder) {
        base.OnModelCreating(builder);

        builder.Entity<User>().HasKey(e => e.ResidentId);
        builder.Entity<User>()
            .HasOne(e => e.ResidentInfo)
            .WithOne()
            .HasForeignKey<User>(r => r.ResidentId);

        builder.Entity<Transaction>()
            .HasOne(e => e.RequesterInfo)
            .WithMany()
            .HasForeignKey(e => e.RequesterId);
        
        builder.Entity<Transaction>()
            .HasOne(e => e.HandlerInfo)
            .WithMany()
            .HasForeignKey(e => e.HandlerId);
        
        builder.Entity<Deceased>().HasKey(e => e.ResidentId);
        builder.Entity<Deceased>()
            .HasOne(e => e.ResidentInfo)
            .WithOne()
            .HasForeignKey<Deceased>(r => r.ResidentId);

        builder.Entity<Senior>().HasKey(e => e.ResidentId);
        builder.Entity<Senior>()
            .HasOne(e => e.ResidentInfo)
            .WithOne()
            .HasForeignKey<Senior>(r => r.ResidentId);
        
        builder.Entity<Pwd>().HasKey(e => e.ResidentId);
        builder.Entity<Pwd>()
            .HasOne(e => e.ResidentInfo)
            .WithOne()
            .HasForeignKey<Pwd>(r => r.ResidentId);


    }

    protected override void ConfigureConventions(ModelConfigurationBuilder builder) {
        base.ConfigureConventions(builder);

        builder.Conventions.Add(_ => new GuidV7Convention());
    }
}
