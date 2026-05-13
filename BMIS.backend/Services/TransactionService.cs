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


    public async Task<Result<List<Transaction>>> GetFiltered(TransactionFilterCriteria criteria) {
        var transactions = _db.Transactions.AsNoTracking();
        
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
    }

    public async Task<Result<int>> Create(TransactionCreateDto details) {
       Transaction transaction = new Transaction(details);    

        _db.Transactions.Add(transaction);
        
        try {
            await _db.SaveChangesAsync();
            Console.WriteLine("[~] save successful");
        } catch (DbUpdateException e) {
            Console.WriteLine($"[!] problem saving {string.Join(" ", e.Entries)}");
            return ResultStatus.Conflict; 
        }

        return transaction.Id;
    }
   
    public async Task<Result<Transaction>> Update(int id, TransactionUpdateDto changes) {
        var transaction = await _db.Transactions.FindAsync(id);

        if(transaction is null) {
            return ResultStatus.NotFound;
        }

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
