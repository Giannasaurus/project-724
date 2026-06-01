using Microsoft.EntityFrameworkCore;
using BMIS.Domain.Entities;
using BMIS.Application.Interfaces;

namespace BMIS.Application.Services;

public class TransactionService : ITransactionService {

    public readonly IUnitOfWork _unitOfWork;
    public readonly ITransactionRepository _transactionRepo;
    public readonly IResidentRepository _residentRepo;
    public readonly IUserRepository _userRepo;

    public TransactionService(
            IUnitOfWork unitOfWork,
			ITransactionRepository transactionRepo,
			IResidentRepository residentRepo,
            IUserRepository userRepo ) {

        _unitOfWork = unitOfWork;
        _transactionRepo = transactionRepo;
        _residentRepo = residentRepo;
        _userRepo = userRepo;
    }

    public async Task<Result<List<Transaction>>> GetAll() {
        return await _transactionRepo.GetAllAsync(); 
    }

    public async Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria) {
        return await _transactionRepo.GetFilteredAsync(criteria); 
    }

    public async Task<Result<Guid>> AddTransaction(TransactionCreateDto details) {
        var requester = _residentRepo.GetByIdAsync(details.requesterId);
        if(requester == null) {
            return ResultStatus.NotFound;
        }
        
        var handler = _userRepo.GetByResidentIdAsync(details.handlerId);
        if(handler == null) {
            return ResultStatus.NotFound;
        }

        var transaction = new Transaction(
                    details.documentType,
                    details.requesterId,
                    details.handlerId,
                    details.dateIssued == null ? DateTime.Now : details.dateIssued
                );
        
        _transactionRepo.Add(transaction);
        await _unitOfWork.SaveChangesAsync();
        // TODO:
        //  error-handling

        return transaction.Id;
    }
   
    public async Task<Result<Transaction>> UpdateTransaction(Guid id, TransactionUpdateDto changes) {
        var transaction = await _transactionRepo.GetByIdAsync(id);
        if(transaction == null) {
            return ResultStatus.NotFound;
        }

        if(changes.requesterId != null) {
            var requester = _residentRepo.GetByIdAsync((Guid)changes.requesterId);
            if(requester == null) {
                return ResultStatus.Conflict;
            }
        }
        
        // TODO:
        //  check handler existance

        transaction.Update(changes.documentType, changes.requesterId, changes.handlerId, changes.dateIssued);

        await _unitOfWork.SaveChangesAsync();

        // TODO:
        //  error-handling

        return transaction;
    }
}
