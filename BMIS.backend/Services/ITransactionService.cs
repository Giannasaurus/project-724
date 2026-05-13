using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Services;

public interface ITransactionService {
    Task<Result<List<Transaction>>> GetAll();
    Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria);

    Task<Result<int>> Create(TransactionCreateDto details);

    Task<Result<Transaction>> Update(int id, TransactionUpdateDto changes);

    Task<Result<Transaction>> Delete(int id);
}
