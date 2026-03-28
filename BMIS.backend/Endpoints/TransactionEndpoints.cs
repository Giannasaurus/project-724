using Microsoft.EntityFrameworkCore;
using BMIS.Models;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Endpoints;

public static class TransactionEndpoints {
    public static void MapTransactionEndpoints(this WebApplication app) {
        var group = app.MapGroup("/transactions");
        
        group.MapGet("/", Get);
        group.MapGet("/filter", GetFiltered);
        group.MapPost("/", Create);
        group.MapPut("/", Update);
        group.MapDelete("/", Delete);
    }

    public static async Task<IResult> Get(AppDbContext db) {
        return TypedResults.Ok(await db.Transactions.AsNoTracking().ToListAsync());
    }

    public static async Task<IResult> GetFiltered([AsParameters] TransactionFilterCriteria criteria, AppDbContext db) {
        var transactions = db.Transactions.AsNoTracking();

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
        
        var results = await transactions
            .Skip(criteria.from)
            .Take(criteria.limit)
            .ToListAsync();

        return TypedResults.Ok(results);
    }

    public static async Task<IResult> Create(Transaction transaction, AppDbContext db) {
        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();

        return TypedResults.Created($"/transactions/{transaction.Id}", transaction);
    }
    
    public static async Task<IResult> Update(int id, Transaction changes, AppDbContext db) {
        var transaction = await db.Transactions.FindAsync(id);

        if(transaction is null) return TypedResults.NotFound();

        transaction.RequesterId = changes.RequesterId;
        transaction.HandlerId = changes.HandlerId;
        transaction.TypeOfDocument = changes.TypeOfDocument;
        transaction.Status = changes.Status;
        transaction.Date = changes.Date;

        return TypedResults.Created($"/transactions/{transaction.Id}", transaction);
    }

    public static async Task<IResult> Delete(int id, AppDbContext db) {
        var transaction = await db.Transactions.FindAsync(id);
        
        if(transaction is null) {
            return TypedResults.NotFound();
        }

        db.Transactions.Remove(transaction);
        await db.SaveChangesAsync();

        return TypedResults.NoContent();
    }
}
