using BMIS.Domain.Entities;
using BMIS.Application;

namespace BMIS.Application.Interfaces;

public interface ITransactionService {
    Task<Result<List<Transaction>>> GetAll();
    Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria);

    Task<Result<Guid>> AddTransaction(TransactionCreateDto details);

    Task<Result<Transaction>> UpdateTransaction(Guid id, TransactionUpdateDto changes);
}
