using Microsoft.AspNetCore.Mvc;
using BMIS.Application;
using BMIS.Application.Interfaces;
using BMIS.Domain.Entities;

namespace BMIS.Endpoints;

public static class BlotterEndpoints {
    public static void MapBlotterEndpoints(this WebApplication app) {
        var group = app.MapGroup("/blotters");

        group.MapGet("/", GetAllAsync);
        group.MapGet("/filter", GetFilteredAsync);
        group.MapGet("/{id}", GetByIdAsync);

        group.MapPost("/", AddBlotterAsync);
        group.MapPut("/{id}", UpdateBlotterAsync);
    }
    
    private static async Task<IResult> GetByIdAsync(Guid id, IBlotterService blotterService) {
        var results = await blotterService.GetByIdAsync(id);
        if(results == null) {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(results.value);
    }

    private static async Task<IResult> GetAllAsync(IBlotterService blotterService) {
        var results = await blotterService.GetAllAsync();
        return TypedResults.Ok(results.value);
    }
    
    private static async Task<IResult> GetFilteredAsync([AsParameters] BlotterFilterCriteria criteria, IBlotterService blotterService) {
        var results = await blotterService.GetFilteredAsync(criteria);
        return TypedResults.Ok(results.value);
    }
    
    private static async Task<IResult> AddBlotterAsync(BlotterCreateDTO details, IBlotterService blotterService) {
        var results = await blotterService.AddBlotterAsync(details);
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }
        
        return TypedResults.Created($"/{results.value}");
    }
    
    private static async Task<IResult> UpdateBlotterAsync(Guid id, BlotterUpdateDTO changes, IBlotterService blotterService) {
        var results = await blotterService.UpdateBlotterAsync(id, changes);
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }
        
        return TypedResults.NoContent();
    }
}


