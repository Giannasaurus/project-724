using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Interfaces;

public interface ITransactionService {
    Task<Result<List<Transaction>>> GetAll();
    Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria);

    Task<Result<int>> AddTransaction(TransactionCreateDto details);

    Task<Result<Transaction>> UpdateTransaction(int id, TransactionUpdateDto changes);

    Task<Result<Transaction>> DeleteTransaction(int id);
}
