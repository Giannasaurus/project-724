using Microsoft.AspNetCore.Mvc;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;
using BMIS.Services;

namespace BMIS.Endpoints;

public static class ResidentEndpoints {
    public static void MapResidentEndpoints(this WebApplication app) {
        var group = app.MapGroup("/residents");

        group.MapGet("/", GetAll);
        group.MapGet("/filter", GetFiltered);

        group.MapGet("/{id}", GetById); 

        group.MapPost("/search", SearchResident);
        group.MapPost("/", Create); 

        group.MapPut("/{id}", Update); 

        group.MapDelete("/{id}", Delete); 
    }


    /*
     *  returns: all data in the database 
     *  
     *  might take some time to load
     *
    */
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
    
    private static async Task<IResult> GetById(int id, IResidentService residentService) {
        var result = await residentService.GetById(id);

        if(result.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(result.value);
    }

    private static async Task<IResult> Create(Resident resident, IResidentService residentService) {
        var result = await residentService.Create(resident);
        
        if (!result.isSuccess) {
            return TypedResults.Conflict();
        }

        return TypedResults.Created($"/residents/{result.value}", resident);
    }

    private static async Task<IResult> Delete(int id, IResidentService residentService) {
        var result = await residentService.Delete(id);
        if(result.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.NoContent();
    }


    /*
     *  TODO: implement DTO
     *
     *
     */
    private static async Task<IResult> Update(int id, Resident changes, AppDbContext db) {
        var resident = await db.Residents.FindAsync(id);

        if(resident is null) return Results.NotFound();

        resident.FirstName = changes.FirstName;
        resident.MiddleName = changes.MiddleName;
        resident.LastName = changes.LastName;
        resident.BirthDate = changes.BirthDate;
        resident.Sector = changes.Sector;
        resident.Sex = changes.Sex;
        resident.CivilStatus = changes.CivilStatus;
        resident.Address = changes.Address;

        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}
