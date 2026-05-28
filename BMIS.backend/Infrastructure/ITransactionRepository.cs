using BMIS.Models.Entities;
using BMIS.Infrastructure.Criterias;

namespace BMIS.Application;

public interface ITransactionRepository {
    Task<List<Transaction>> GetAllAsync();
    Task<Transaction?> GetByIdAsync(Guid id);
    Task<List<Transaction>> GetFilteredAsync(TransactionFilterCriteria criteria);

    void Add(Transaction transaction);
}
