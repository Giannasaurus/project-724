using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface ITransactionRepository {
    Task<List<Transaction>> GetAllAsync();
    Task<Transaction?> GetByIdAsync(Guid id);
    Task<List<Transaction>> GetFilteredAsync(TransactionFilterCriteria criteria);

    void Add(Transaction transaction);
}
