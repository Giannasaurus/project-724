using Microsoft.AspNetCore.Mvc;
using BMIS.Models.DTOs;
using BMIS.Services;
using BMIS.Interfaces;
using BMIS.Infrastructure.Criterias;

namespace BMIS.Endpoints;

public static class ResidentEndpoints {
    public static void MapResidentEndpoints(this WebApplication app) {
        var group = app.MapGroup("/residents").RequireAuthorization();

        group.MapGet("/", GetAll);
        group.MapGet("/filter", GetFiltered);
        group.MapGet("/{id}", GetById); 

        group.MapPost("/search", SearchResident);
        group.MapPost("/", Create); 

        group.MapPut("/{id}", Update); 
    }

    private static async Task<IResult> GetAll(
            IResidentService residentService) {

        var result = await residentService.GetAll(); 
        return TypedResults.Ok(result.value); 
    }


    private static async Task<IResult> SearchResident(
            [FromBody] SearchRequest search,
            [AsParameters] ResidentFilterCriteria criteria,
            IResidentService residentService) {

        var result = await residentService.GetSearchResults(search, criteria);  
        return TypedResults.Ok(result.value);
    }


    private static async Task<IResult> GetFiltered(
            [AsParameters] ResidentFilterCriteria criteria,
            IResidentService residentService) {

        var result = await residentService.GetFiltered(criteria); 
        return TypedResults.Ok(result.value); 

    }
    
    private static async Task<IResult> GetById(Guid id, IResidentService residentService) {
        var result = await residentService.GetById(id);

        if(result.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(result.value);
    }

    private static async Task<IResult> Create(ResidentCreateDto details, IResidentService residentService) {
        var result = await residentService.AddResident(details);
        
        if (result.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }

        return TypedResults.Created($"/residents/{result.value}");
    }

    private static async Task<IResult> Update(Guid id, ResidentUpdateDto changes, IResidentService residentService) {
        var result = await residentService.UpdateResident(id, changes); 
        
        if(result.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.NoContent(); 
    }
}
