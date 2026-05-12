using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;
using BMIS.Models;

namespace BMIS.Services;

public class TransactionService : ITransactionService {
    public readonly AppDbContext _db;

    public TransactionService(AppDbContext db) {
        _db = db;
    }

    public async Task<Result<List<Transaction>>> GetAll() {
        return await _db.Transactions.AsNoTracking().ToListAsync();
    }


    /*
     *  TODO:
     *      refactor this
     *
     */
    public async Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria) {
        var transactions = _db.Transactions.AsNoTracking();

        if(criteria.type != null && criteria.type.Length > 0) {
            var selected = criteria.type
                .Select(t => Enum.TryParse<DocumentType>(t, true, out DocumentType parsed) ? parsed : (DocumentType?)null)
                .Where(t => t.HasValue)
                .Select(t => t!.Value)
                .ToList();
            
            transactions = transactions.Where(t => selected.Contains(t.TypeOfDocument));
        }
        
        if(criteria.status != null && criteria.status.Length > 0) {
            var selected = criteria.status
                .Select(t => Enum.TryParse<TransactionStatus>(t, true, out TransactionStatus parsed) ? parsed : (TransactionStatus?)null)
                .Where(t => t.HasValue)
                .Select(t => t!.Value)
                .ToList();
            
            transactions = transactions.Where(t => selected.Contains(t.Status));
        }

        if(criteria.from != null) {
            transactions = transactions.Where(t => t.Date <= criteria.from);
        }
        
        if(criteria.to != null) {
            transactions = transactions.Where(t => t.Date >= criteria.to);
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
    }

    public async Task<Result<int>> Create(Transaction transaction) {
    
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        return transaction.Id;
    }
   

    /*
     * TODO: 
     *  refactor this and create a TransactionUpdateDto
     *
     */
    public async Task<Result<Transaction>> Update(int id, Transaction changes) {
        var transaction = await _db.Transactions.FindAsync(id);

        if(transaction is null) {
            return ResultStatus.NotFound;
        }

        transaction.RequesterId = changes.RequesterId;
        transaction.HandlerId = changes.HandlerId;
        transaction.TypeOfDocument = changes.TypeOfDocument;
        transaction.Status = changes.Status;
        transaction.Date = changes.Date;

        return transaction;
    }

    public async Task<Result<Transaction>> Delete(int id) {
        var transaction = await _db.Transactions.FindAsync(id);
        
        if(transaction is null) {
            return ResultStatus.NotFound;
        }

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();

        return transaction;
    }

}
