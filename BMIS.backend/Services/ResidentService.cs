using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;
using BMIS.Models;
using BMIS;

namespace BMIS.Services;

public class ResidentService : IResidentService {

    public readonly AppDbContext _db;

    public ResidentService(AppDbContext db) {
        _db = db;
    }

    public async Task<List<Resident>> GetAllResidents() {
        return await _db.Residents.AsNoTracking().ToListAsync();
    }

    public async Task<List<Resident>> GetFilteredResidents(ResidentFilterCriteria criteria) {
        var residents = _db.Residents.AsNoTracking();

        /* 
         * [WARNING] SHOULD BE MOVE, PUTTING NAME SEARCH IN URL IS NOT PRIVATE
         *
         * START NAME SEARCH
         *

        if(!string.IsNullOrEmpty(criteria.firstName)) {   
            residents = residents.Where(r => r.FirstName.ToLower().Contains(criteria.firstName.ToLower()));
        }

        if(!string.IsNullOrEmpty(criteria.middleName)) {   
            residents = residents.Where(r => r.MiddleName.ToLower().Contains(criteria.middleName.ToLower()));
        }
        
        if(!string.IsNullOrEmpty(criteria.lastName)) {   
            residents = residents.Where(r => r.LastName.ToLower().Contains(criteria.lastName.ToLower()));
        }

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
        return results;
    } 
    
    public async Task<List<Resident>> GetSearchResidentResults(SearchRequest search, ResidentFilterCriteria criteria) {
        var residents = _db.Residents.AsNoTracking();

        DateOnly minCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-criteria.minAge ?? 0);
        DateOnly maxCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-criteria.maxAge ?? -999);
        residents = residents.Where(r => maxCutoff <= r.BirthDate && r.BirthDate <= minCutoff);
        
        /*
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

        */

        var results = await residents.ToListAsync();

        results.Sort((x, y) => { 
                double simY = GetMaxSimilarity(search.query, y);
                double simX = GetMaxSimilarity(search.query, x);
                int simCompare = simY.CompareTo(simX);

                if(simCompare != 0) {
                    return simCompare;
                }

                return x.ToString().CompareTo(y.ToString());
            });

        results = results.GetRange(criteria.from ?? 0, Math.Min(criteria.limit ?? results.Count, results.Count));
        return results;

    }  

    private static double GetMaxSimilarity(string query, Resident r) {
        List<string> name = new() { r.FirstName, r.LastName };
        
        if(!string.IsNullOrEmpty(r.MiddleName)) {
            name.Add(r.MiddleName);
        }

        if(!string.IsNullOrEmpty(r.Suffix)) {
            name.Add(r.Suffix);
        }

        List<List<string>> permutations = Utils.GetPermutations<string>(name.ToArray());
        
        double[] values = new double[permutations.Count];

        for(int i = 0; i < permutations.Count; i++) {
            string nameP = string.Join(" ", permutations[i]);
            values[i] = Utils.GetJaroWinklerDis(query, nameP); 
        }

        double max = 0;
        for(int i = 0; i < values.Length; i++) {
            if(values[i] > max) {
                max = values[i];
            }
        }

        return max;
    }
}
