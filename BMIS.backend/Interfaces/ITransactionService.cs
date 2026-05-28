using BMIS.Models.Entities;
using BMIS.Models.DTOs;
using BMIS.Infrastructure.Criterias;

namespace BMIS.Interfaces;

public interface ITransactionService {
    Task<Result<List<Transaction>>> GetAll();
    Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria);

    Task<Result<Guid>> AddTransaction(TransactionCreateDto details);

    Task<Result<Transaction>> UpdateTransaction(Guid id, TransactionUpdateDto changes);
}
