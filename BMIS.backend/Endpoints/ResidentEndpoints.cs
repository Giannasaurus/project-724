using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using BMIS.Models;
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

        var residents = await residentService.GetAllResidents(); 
        return TypedResults.Ok(residents); 

    }


    private static async Task<IResult> SearchResident(
            [FromBody] SearchRequest search,
            [AsParameters] ResidentFilterCriteria criteria,
            IResidentService residentService) {

        /*
         *  BUG: 
         *   GetFiltered() returns a list of residents that is paged and ordered
         *   for ex. from = 2, limit = 50, order = ByLastName 
         *      GetFiltered() will return a list of (50) residents starting from index (2)
         *      in a list of residents that is ordered (ByLastName)
         *
         *  Goal:
         *   this function should return a list of resident ordered by their similarity ranking
         *   then from this list of residents we would apply the paging (e.g from index 2 take 50 residents)
         *
         *
         *
         */

        var result = await residentService.GetSearchResidentResults(search, criteria);  
        return TypedResults.Ok(result);
    }


    private static async Task<IResult> GetFiltered(
            [AsParameters] ResidentFilterCriteria criteria,
            IResidentService residentService) {

        var results = await residentService.GetFilteredResidents(criteria); 
        return TypedResults.Ok(results); 

    }
    
    /*
     *
     * returns: resident w/ id
     *
     *
     */
    private static async Task<IResult> GetById(int id, AppDbContext db) {
        var resident = await db.Residents.FindAsync(id);

        if(resident is null) return TypedResults.NotFound();

        return TypedResults.Ok(resident);
    }



    private static async Task<IResult> Create(Resident resident, AppDbContext db) {
        db.Residents.Add(resident);

        await db.SaveChangesAsync();

        return TypedResults.Created($"/residents/{resident.ResidentId}", resident);
    }



    private static async Task<IResult> Delete(int id, AppDbContext db) {
        var resident = await db.Residents.FindAsync(id);

        if(resident is null) {
            return Results.NotFound();
        }

        db.Residents.Remove(resident);
        await db.SaveChangesAsync();

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
