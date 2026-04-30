using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using BMIS.Models;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Endpoints;

public record SearchName(string? name);

public static class ResidentEndpoints {
    public static void MapResidentEndpoints(this WebApplication app) {
        var group = app.MapGroup("/residents");

        group.MapGet("/", Get);
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
    private static async Task<IResult> Get(AppDbContext db) {
        var residents = await db.Residents.AsNoTracking().ToListAsync();
        return TypedResults.Ok(residents); 
    }

    /*
     *  TODO: 
     *      Move this to a different file or a utility class
     *
     *  Definition:
     *      Checks how similar (2) set of strings are
     *      
     *      Formula:
     *          cosine similarity = dot(A, B) / (l2_norm(A) * l2_norm(B))
     *
     *
     *      set of strings <- a string with multiple words separated by spaces
     *
     */
    private static double GetCosineSim(string a, string b) {
        Dictionary<string, int> vocabulary = new Dictionary<string, int>();

        string[] wordsA = a.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(s => s.Trim().Trim(',').ToLower())
                            .ToArray();

        string[] wordsB = b.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                            .Select(s => s.Trim().Trim(',').ToLower())
                            .ToArray();
        
        string[] allWords = wordsA.Concat(wordsB).ToArray();

        int index = 0;
        foreach(string s in allWords) {
            if(!vocabulary.ContainsKey(s)) {
                vocabulary.Add(s, index);
                index++;
            }
        }
       
        int[] A = new int[index];
        int[] B = new int[index];
        
        foreach(string s in wordsA){
            A[vocabulary[s]] += 1; 
        }
        
        foreach(string s in wordsB){
            B[vocabulary[s]] += 1; 
        }
        
        double dotp = 0; 
        double normA = 0;
        double normB = 0;

        for(int i = 0; i < index; i++) {
            dotp += A[i] * B[i]; 
            normA += A[i] * A[i];
            normB += B[i] * B[i];
        }

        normA = Math.Sqrt(normA);
        normB = Math.Sqrt(normB);
        
        return dotp / (normA * normB);
    }






    private static async Task<IResult> SearchResident(
            [FromBody] SearchName name,
            [AsParameters] ResidentFilterCriteria criteria,
            AppDbContext db) {

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

        var result = await GetFiltered(criteria, db);
        List<Resident> contents = new List<Resident>();
        if(result is Ok<List<Resident>> res) {
            contents = res.Value ?? contents;
        }

        foreach(var c in contents) {
            Console.WriteLine(c);
        }
        
        return TypedResults.Ok(contents);
    }






    /*
     * URGENT: 
     *  refactor this shitty function
     *
     *  
     *
     *
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
         */

        if(!string.IsNullOrEmpty(criteria.firstName)) {   
            residents = residents.Where(r => r.FirstName.ToLower().Contains(criteria.firstName.ToLower()));
        }

        if(!string.IsNullOrEmpty(criteria.middleName)) {   
            residents = residents.Where(r => r.MiddleName.ToLower().Contains(criteria.middleName.ToLower()));
        }
        
        if(!string.IsNullOrEmpty(criteria.lastName)) {   
            residents = residents.Where(r => r.LastName.ToLower().Contains(criteria.lastName.ToLower()));
        }

        /*
         *
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

        if(criteria.sex != null && criteria.sex.Count() > 0) {
            var selected = criteria.sex
                .Select(s => Enum.TryParse<Sex>(s, true, out Sex parsed) ? parsed : (Sex?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
            
            residents = residents.Where(r => selected.Contains(r.Sex)); 
        }
        
        if(criteria.sector != null && criteria.sector.Count() > 0) {
            var selected = criteria.sector
                .Select(s => Enum.TryParse<Sector>(s, true, out Sector parsed) ? parsed : (Sector?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
            
            residents = residents.Where(r => selected.Contains(r.Sector)); 
        }
        
        if(criteria.civilStat != null && criteria.civilStat.Count() > 0) {
            var selected = criteria.civilStat
                .Select(s => Enum.TryParse<CivilStatus>(s, true, out CivilStatus parsed) ? parsed : (CivilStatus?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();
            
            residents = residents.Where(r => selected.Contains(r.CivilStatus)); 
        }

        switch(criteria.order) {
            case ResidentOrder.ByFirstName:
                residents = residents.OrderBy(r => r.FirstName);
                break;
            case ResidentOrder.ByFirstNameDesc:
                residents = residents.OrderByDescending(r => r.FirstName);
                break;
            case ResidentOrder.ByMiddleName:
                residents = residents.OrderBy(r => r.MiddleName);
                break;
            case ResidentOrder.ByMiddleNameDesc:
                residents = residents.OrderByDescending(r => r.MiddleName);
                break;
            case ResidentOrder.ByLastName:
                residents = residents.OrderBy(r => r.LastName);
                break;
            case ResidentOrder.ByLastNameDesc:
                residents = residents.OrderByDescending(r => r.LastName);
                break;
            case ResidentOrder.ByAge:
                residents = residents.OrderByDescending(r => r.BirthDate); // starts from youngest to oldest
                break;
            case ResidentOrder.ByAgeDesc:
                residents = residents.OrderBy(r => r.BirthDate); // starts from oldest to youngest
                break;
            default:
                residents = residents.OrderBy(r => r.LastName);
                break;
        }

        if(criteria.from != null) {
            residents = residents.Skip(criteria.from ?? 0);
        }

        if(criteria.limit != null) {
            residents = residents.Take(criteria.limit ?? residents.Count());
        }

        var results = await residents.ToListAsync();

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
