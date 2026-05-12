using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Services;

public interface ITransactionService {
    Task<Result<List<Transaction>>> GetAll();
    Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria);

    Task<Result<int>> Create(Transaction transaction);

    Task<Result<Transaction>> Update(int id, Transaction changes);

    Task<Result<Transaction>> Delete(int id);
}
