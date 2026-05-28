namespace BMIS.Application;

public interface IUnitOfWork : IDisposable  {
    Task<int> SaveChangesAsync(CancellationToken token = default);
}
