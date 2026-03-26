using Microsoft.EntityFrameworkCore;
using BMIS.Models;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Endpoints;

public static class ResidentEndpoints {
    public static void MapResidentEndpoints(this WebApplication app) {
        var group = app.MapGroup("/residents");

        group.MapGet("/", Get);
        group.MapGet("/filter", GetFiltered);
        
        /* 
         * OLDER VERSION
         *
         * use /filter endpoint instead
         *
         *
        */
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




    /*
     * TODO:
     *  filtering w/ names is somewhat very straightfoward
     *  it does not account for human-errors like misspelled names
     *  
     *  therefore, we should implement a threshold for this where least error
     *  or better matching entries are on top
     *
     *
     *
     */
    private static async Task<IResult> GetFiltered([AsParameters] ResidentFilterCriteria criteria, AppDbContext db) {
        var residents = db.Residents.AsNoTracking();
        /* 
         * [WARNING] SHOULD BE MOVE, PUTTING NAME SEARCH IN URL IS NOT PRIVATE
         *
         * START NAME SEARCH
         *
         *

        if(!string.IsNullOrEmpty(criteria.firstName)) {   
            residents = residents.Where(r => r.FirstName.Contains(criteria.firstName));
        }

        if(!string.IsNullOrEmpty(criteria.middleName)) {   
            residents = residents.Where(r => r.MiddleName.Contains(criteria.middleName));
        }
        
        if(!string.IsNullOrEmpty(criteria.lastName)) {   
            residents = residents.Where(r => r.LastName.Contains(criteria.lastName));
        }

         *

Enter
         * END NAME SEARCH
         *
         */
        

        if(criteria.minAge.HasValue) {
            DateOnly minCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-criteria.minAge ?? 0);
            residents = residents.Where(r => r.BirthDate <= minCutoff);
        }

        if(criteria.maxAge.HasValue) {
            DateOnly maxCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-criteria.maxAge ?? 0);
            residents = residents.Where(r => r.BirthDate >= maxCutoff);
        }

        if(criteria.sex != null && criteria.sex.Length > 0) {
            var selected = criteria.sex
                .Select(s => Enum.TryParse<Sex>(s, true, out Sex parsed) ? parsed : (Sex?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
            
            residents = residents.Where(r => selected.Contains(r.Sex)); 
        }
        
        if(criteria.sector != null && criteria.sector.Length > 0) {
            var selected = criteria.sector
                .Select(s => Enum.TryParse<Sector>(s, true, out Sector parsed) ? parsed : (Sector?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
            
            residents = residents.Where(r => selected.Contains(r.Sector)); 
        }
        
        if(criteria.civilStat != null && criteria.civilStat.Length > 0) {
            var selected = criteria.civilStat
                .Select(s => Enum.TryParse<CivilStatus>(s, true, out CivilStatus parsed) ? parsed : (CivilStatus?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
            
            residents = residents.Where(r => selected.Contains(r.CivilStatus)); 
        }

        // pagination
        var results = await residents
            .Skip((criteria.page - 1) * criteria.pageSize)
            .Take(criteria.pageSize)
            .ToListAsync();

        return TypedResults.Ok(results); 
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
