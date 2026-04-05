using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;

public class AppDbContext : DbContext {
    public DbSet<Resident> Residents { get; set; }
    public DbSet<Transaction> Transactions { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
}
