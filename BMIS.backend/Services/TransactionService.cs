using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;
using BMIS.Models;
using BMIS.Interfaces;
using BMIS.Infrastructure.Criterias;
using BMIS.Application;
using BMIS.Infrastructure;

namespace BMIS.Services;

public class TransactionService : ITransactionService {

    public readonly IUnitOfWork _unitOfWork;
    public readonly ITransactionRepository _transactionRepo;
    public readonly IResidentRepository _residentRepo;

    public TransactionService(IUnitOfWork unitOfWork, ITransactionRepository transactionRepo, IResidentRepository residentRepo) {
        _unitOfWork = unitOfWork;
        _transactionRepo = transactionRepo;
        _residentRepo = residentRepo;
    }

    public async Task<Result<List<Transaction>>> GetAll() {
        return await _transactionRepo.GetAllAsync(); 
    }


    public async Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria) {
        return await _transactionRepo.GetFilteredAsync(criteria); 
        
        /* 
        if(criteria.from != null) {
            transactions = transactions.Where(t => t.Date <= criteria.from);
        }
        
        if(criteria.to != null) {
            transactions = transactions.Where(t => t.Date >= criteria.to);
        }

        if(criteria.type != null && criteria.type.Length > 0) {
            HashSet<DocumentType> filter = new HashSet<DocumentType>();
            foreach(string entry in criteria.type) {
                if(Enum.TryParse<DocumentType>(entry, true, out DocumentType parsed)) {
                    filter.Add(parsed);
                }
            }
            
            transactions = transactions.Where(t => filter.Contains(t.DocumentType));
        }
        
        if(criteria.status != null && criteria.status.Length > 0) {
            HashSet<TransactionStatus> filter = new HashSet<TransactionStatus>();
            foreach(string entry in criteria.status) {
                if(Enum.TryParse<TransactionStatus>(entry, true, out TransactionStatus parsed)) {
                    filter.Add(parsed);
                }
            }
            
            transactions = transactions.Where(t => filter.Contains(t.Status));
        }

        switch(criteria.order) {
            case TransactionOrder.ByRecent:
                transactions = transactions.OrderByDescending(t => t.Date);
                break;
            case TransactionOrder.ByOldest:
                transactions = transactions.OrderBy(t => t.Date);
                break;
            default:
                transactions = transactions.OrderByDescending(t => t.Date);
                break;
        }
        
        var results = await transactions
            .Skip(criteria.index)
            .Take(criteria.limit)
            .ToListAsync();

        return results;
        */
    }

    public async Task<Result<Guid>> AddTransaction(TransactionCreateDto details) {
        Transaction transaction;

        var requester = _residentRepo.GetByIdAsync(details.requesterId);
        if(requester == null) {
            Console.WriteLine("[!] requester does not exist");
            return ResultStatus.Conflict;
        }
        
        var handler = _residentRepo.GetByIdAsync(details.handlerId);
        if(handler == null) {
            Console.WriteLine("[!] handler does not exist");
            return ResultStatus.Conflict;
        }

        // TODO:
        //  check handler existance
        
        if(details.dateIssued != null) {
            transaction = new Transaction(details.documentType, details.requesterId, details.handlerId, details.dateIssued);
        } else {
            transaction = new Transaction(details.documentType, details.requesterId, details.handlerId);
        }

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
