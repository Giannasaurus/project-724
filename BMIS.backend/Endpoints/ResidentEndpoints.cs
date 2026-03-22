using Microsoft.EntityFrameworkCore;
using BMIS.Models;
using BMIS.Models.Entities;

namespace BMIS.Endpoints;

public static class ResidentEndpoints {
    public static void MapResidentEndpoints(this WebApplication app) {
        var group = app.MapGroup("/residents");

        group.MapGet("/", Get);
        group.MapGet("/age", GetByAge);
        group.MapGet("/sector", GetBySector);
        group.MapGet("/name", GetByName);

        group.MapGet("/from", GetRange);
        group.MapGet("/{id}", GetById); 

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
    private static async Task<IResult> Get(AppDbContext db) {
        var residents = await db.Residents.AsNoTracking().ToListAsync();
        return TypedResults.Ok(residents); 
    }

    private static async Task<IResult> GetByAge(int? minAge, int? maxAge, AppDbContext db) {
        minAge ??= 0;
        maxAge ??= 999;

        var residents = await db.Residents
            .AsNoTracking()
            .Where(r => r.Age >= minAge && r.Age <= maxAge)
            .ToListAsync();

        return TypedResults.Ok(residents); 
    }


    /*
     *
     * Senior or PWD
     *
     *
     */
    private static async Task<IResult> GetBySector(Sector? sector, AppDbContext db) {
        var residents = await db.Residents
            .AsNoTracking()
            .Where(r => r.Sector == sector)
            .ToListAsync();

        return TypedResults.Ok(residents);
    }

    private static async Task<IResult> GetByName(string? first, string? middle, string? last, AppDbContext db) {
        var residents = db.Residents.AsNoTracking();

        first = first == null ? string.Empty : first.Trim().ToLower();
        middle = middle == null ? string.Empty : middle.Trim().ToLower();
        last = last == null ? string.Empty : last.Trim().ToLower();

        if(first != string.Empty) {
            residents = residents.Where(r => r.FirstName == first);
        }

        if(middle != string.Empty) {
            residents = residents.Where(r => r.MiddleName == middle);
        }

        if(last != string.Empty) {
            residents = residents.Where(r => r.LastName == last);
        }

        return TypedResults.Ok(await residents.ToListAsync());
    }

    
    /*
     *
     * returns: data from specific index up to limit
     * 
     *
    */
    private static async Task<IResult> GetRange(int? index, int? limit, string? orderBy, AppDbContext db) {
        int rangeIndex = index ?? 0;
        int rangeLimit = limit ?? 50;

        var residents = db.Residents.AsNoTracking();
        
        switch(orderBy) {
            case "first_name":
                residents = residents.OrderBy(r => r.FirstName);
                break;
            case "first_name_desc":
                residents = residents.OrderByDescending(r => r.FirstName);
                break;
            case "last_name":
                residents = residents.OrderBy(r => r.LastName);
                break;
            case "last_name_desc":
                residents = residents.OrderByDescending(r => r.LastName);
                break;
            case "age":
                residents = residents.OrderBy(r => r.Age);
                break;
            case "age_desc":
                residents = residents.OrderByDescending(r => r.Age);
                break;
            default:
                break;
        }

        var results = await residents 
            .AsNoTracking()
            .Skip(rangeIndex)
            .Take(rangeLimit)
            .ToListAsync();

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

        return TypedResults.Created($"/residents/{resident.Id}", resident);
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



    private static async Task<IResult> Update(int id, Resident changes, AppDbContext db) {
        var resident = await db.Residents.FindAsync(id);

        if(resident is null) return Results.NotFound();

        resident.FirstName = changes.FirstName;
        resident.MiddleName = changes.MiddleName;
        resident.LastName = changes.LastName;
        resident.BirthDate = changes.BirthDate;
        resident.Sector = changes.Sector;
        resident.Gender = changes.Gender;
        resident.CivilStatus = changes.CivilStatus;
        resident.Address = changes.Address;

        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}
