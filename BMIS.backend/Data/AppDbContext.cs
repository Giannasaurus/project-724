using Microsoft.EntityFrameworkCore;
using BMIS.Domain.Entities;

namespace BMIS;

public class AppDbContext : DbContext {
    public DbSet<Resident> Residents { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<HouseHold> HouseHolds { get; set; } 
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<User> Users { get; set; }

    public DbSet<Deceased> Deaths { get; set; }
    public DbSet<Senior> Seniors { get; set; }
    public DbSet<Pwd> PWDs{ get; set; }
    public DbSet<Official> Officials{ get; set; }

    public DbSet<Blotter> Blotters { get; set; }
    public DbSet<BlotterParticipant> BlotterParticipants { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder builder) {
        base.OnModelCreating(builder);

        builder.Entity<Resident>()
            .HasKey(e => e.Id);
        
        builder.Entity<Official>(entity => {
            entity.HasKey(e => e.ResidentId);
            
            entity.HasOne(e => e.ResidentInfo)
                  .WithOne()
                  .HasForeignKey<Official>(e => e.ResidentId)
                  .IsRequired();
        });

        builder.Entity<User>(entity => {
            entity.HasKey(e => e.ResidentId);

            entity.HasOne(e => e.OfficialInfo)
                  .WithOne()
                  .HasForeignKey<User>(e => e.ResidentId)
                  .IsRequired();
        });

        builder.Entity<Transaction>(entity => {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.HandlerInfo)
                  .WithMany()
                  .HasForeignKey(e => e.HandlerId);

            entity.HasOne(e => e.RequesterInfo)
                  .WithMany()
                  .HasForeignKey(e => e.RequesterId);
        });
        
        builder.Entity<Senior>(entity => {
            entity.HasKey(e => e.ResidentId);
            
            entity.HasOne(e => e.ResidentInfo)
                  .WithOne()
                  .HasForeignKey<Senior>(e => e.ResidentId);
        });
        
        builder.Entity<Pwd>(entity => {
            entity.HasKey(e => e.ResidentId);
            
            entity.HasOne(e => e.ResidentInfo)
                  .WithOne()
                  .HasForeignKey<Pwd>(e => e.ResidentId);
        });

        builder.Entity<Deceased>(entity => {
            entity.HasKey(e => e.ResidentId);
            
            entity.HasOne(e => e.ResidentInfo)
                  .WithOne()
                  .HasForeignKey<Deceased>(e => e.ResidentId);
        });

        builder.Entity<BlotterParticipant>(entity => {
            entity.HasKey(e => new { e.BlotterId, e.ResidentId });

            entity.HasOne(e => e.ResidentInfo)
                  .WithOne()
                  .HasForeignKey<BlotterParticipant>(e => e.ResidentId);
            
            entity.HasOne(e => e.BlotterInfo)
                  .WithMany(o => o.Participants)
                  .HasForeignKey(e => e.BlotterId);
        });
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder builder) {
        base.ConfigureConventions(builder);

        builder.Conventions.Add(_ => new GuidV7Convention());
    }
}
