using BMIS.Models.DTOs;
using BMIS.Services;

namespace BMIS.Endpoints;

public static class TransactionEndpoints {
    public static void MapTransactionEndpoints(this WebApplication app) {
        var group = app.MapGroup("/transactions");
        
        group.MapGet("/", GetAll);
        group.MapGet("/filter", GetFiltered);
        group.MapPost("/", Create);
        group.MapPut("/{id}", Update);
        group.MapDelete("/{id}", Delete);
    }

    public static async Task<IResult> GetAll(ITransactionService transactionService) {
        var results = await transactionService.GetAll(); 

        return TypedResults.Ok(results.value);
    }

    public static async Task<IResult> GetFiltered([AsParameters] TransactionFilterCriteria criteria, ITransactionService transactionService) {
        var results = await transactionService.GetFiltered(criteria);

        return TypedResults.Ok(results.value);
    }

    public static async Task<IResult> Create(TransactionCreateDto details, ITransactionService transactionService) {
        var results = await transactionService.Create(details);

        return TypedResults.Created($"transactions/{results.value}");
    }
    
    public static async Task<IResult> Update(int id, TransactionUpdateDto changes, ITransactionService transactionService) {
        var results = await transactionService.Update(id, changes);
        
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.NoContent();
    }

    public static async Task<IResult> Delete(int id, ITransactionService transactionService) {
        var results = await transactionService.Delete(id);
        
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }
            
        return TypedResults.NoContent();
    }
}
