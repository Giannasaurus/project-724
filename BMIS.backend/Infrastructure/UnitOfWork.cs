using BMIS.Application;

namespace BMIS.Infrastructure;

public class UnitOfWork : IUnitOfWork {

    private readonly AppDbContext _db;

    public UnitOfWork(AppDbContext db) {
        _db = db;
    }

    public async Task<int> SaveChangesAsync(CancellationToken token = default) {
        return await _db.SaveChangesAsync(token);    
    }

    public void Dispose() {
        _db.Dispose();
    }
}
