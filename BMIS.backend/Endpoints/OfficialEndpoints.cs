using Microsoft.AspNetCore.Builder;
using BMIS.Application;
using BMIS.Application.Interfaces;

namespace BMIS.Endpoints;

public static class OfficialEndpoints {
    public static RouteGroupBuilder MapOfficialEndpoints(this WebApplication app) {
        var group = app.MapGroup("/officials");
        
        group.MapGet("", GetAllAsync);
        group.MapGet("/filter", GetFilteredAsync);
        group.MapGet("/{id}", GetByResidentIdAsync);
        
        group.MapPost("", AddAsync);
        group.MapPut("/{id}", UpdateAsync);

        return group;
    }

    private static async Task<IResult> GetAllAsync(IOfficialService officialService){
        var result = await officialService.GetAllAsync();
        return TypedResults.Ok(result.value); 
    }
    
    private static async Task<IResult> GetFilteredAsync([AsParameters] OfficialFilterCriteria criteria, IOfficialService officialService){
        var result = await officialService.GetFilteredAsync(criteria);
        return TypedResults.Ok(result.value); 
    }
    
    private static async Task<IResult> GetByResidentIdAsync(Guid residentId, IOfficialService officialService){
        var result = await officialService.GetByResidentIdAsync(residentId);
        if(result.code == ResultStatus.NotFound){
            return TypedResults.NotFound();
        }
        
        return TypedResults.Ok(result.value); 
    }
    
    private static async Task<IResult> AddAsync(OfficialCreateDTO details, IOfficialService officialService){
        var result = await officialService.AddAsync(details);
        
        if (result.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }
        
        return TypedResults.Created($"/official/{result.value}"); 
    }

    private static async Task<IResult> UpdateAsync(Guid residentId, OfficialUpdateDTO changes, IOfficialService officialService){
        var result = await officialService.UpdateAsync(residentId, changes);
        
        if (result.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }
        
        return TypedResults.NoContent();
    }
}

