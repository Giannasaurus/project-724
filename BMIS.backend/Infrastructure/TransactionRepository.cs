using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;
using BMIS.Application;
using BMIS.Infrastructure.Criterias;

namespace BMIS.Infrastructure;

public class TransactionRepository : ITransactionRepository {

    private readonly AppDbContext _db;

    public TransactionRepository(AppDbContext db) {
        _db = db;
    }

    public async Task<List<Transaction>> GetAllAsync() {
        return await _db.Transactions.AsNoTracking().ToListAsync(); 
    }
    
    public async Task<Transaction?> GetByIdAsync(Guid id) {
        return await _db.Transactions.FindAsync(id); 
    }
    
    // TODO:
    //  implement filtering
    public async Task<List<Transaction>> GetFilteredAsync(TransactionFilterCriteria criteria) {
        return null; 
    }

    public void Add(Transaction transaction) {
        _db.Transactions.Add(transaction); 
    }
}
