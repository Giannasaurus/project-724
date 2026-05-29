namespace BMIS.Application.Interfaces;

public interface IUnitOfWork : IDisposable  {
    Task<int> SaveChangesAsync(CancellationToken token = default);
}
