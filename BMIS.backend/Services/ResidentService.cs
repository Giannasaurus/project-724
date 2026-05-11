using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;
using BMIS.Models;
using BMIS.Interfaces;

namespace BMIS.Services;

public class ResidentService : IResidentService, ISearchable {

    public readonly AppDbContext _db;

    public ResidentService(AppDbContext db) {
        _db = db;
    }

    public async Task<List<Resident>> GetAll() {
        return await _db.Residents.AsNoTracking().ToListAsync();
    }

    public async Task<Resident?> GetById(int id) {
        return await _db.Residents.FindAsync(id);
    }

    public async Task<List<Resident>> GetFiltered(ResidentFilterCriteria criteria) {
        var residents = FilterResidents(criteria);

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

        var results = await residents.ToListAsync();
        results = Utils.GetListRange(results, criteria.from, criteria.limit);

        return results;
    } 
    
    public async Task<List<Resident>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria) {
        var residents = FilterResidents(criteria)
                            .Select(r => new { Resident = r, Score = GetSimilarityScore(search.query, r.ToString() })
                            .OrderByDescending(r => r.Score)
                            .ThenBy(r => r.Resident.ToString())
                            .Select(r => r.Resident);

        return Utils.GetListRange<Resident>(await residents.ToListAsync(), criteria.from, criteria.limit);
    }

    public async void Create(string resident) {
        _db.Add(resident);
        await _db.SaveChangesAsync();
    }

    private IQueryable<Resident> FilterResidents(ResidentFilterCriteria criteria) {
        var residents = _db.Residents.AsNoTracking();

        DateOnly minCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-criteria.minAge);
        DateOnly maxCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-criteria.maxAge);
        residents = residents.Where(r => maxCutoff <= r.BirthDate && r.BirthDate <= minCutoff);

        if(criteria.sex != null && criteria.sex.Any()) {
            HashSet<Sex> valid = new HashSet<Sex>();

            foreach(var s in criteria.sex) {
                if(Enum.TryParse<Sex>(s, true, out Sex parsed)) {
                    valid.Add(parsed);
                }
            }
            
            residents = residents.Where(r => valid.Contains(r.Sex)); 
        }
        
        if(criteria.sector != null && criteria.sector.Count() > 0) {
            HashSet<Sector> valid = new HashSet<Sector>();

            foreach(var s in criteria.sector) {
                if(Enum.TryParse<Sector>(s, true, out Sector parsed)) {
                    valid.Add(parsed);
                }
            }
            
            residents = residents.Where(r => valid.Contains(r.Sector)); 
        }
        
        if(criteria.civilStat != null && criteria.civilStat.Count() > 0) {
            HashSet<CivilStatus> valid = new HashSet<CivilStatus>();

            foreach(var s in criteria.civilStat) {
                if(Enum.TryParse<CivilStatus>(s, true, out CivilStatus parsed)) {
                    valid.Add(parsed);
                }
            }
            
            residents = residents.Where(r => valid.Contains(r.CivilStatus)); 
        }

        return residents;
    }

    private static double GetSimilarityScore(string reference, string candidate) {
        string[] names = candidate.Split(new string[] { ",", " " }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        List<List<string>> permutations = Utils.GetPermutations<string>(names.ToArray());
        
        double[] values = new double[permutations.Count];

        for(int i = 0; i < permutations.Count; i++) {
            string nameP = string.Join(" ", permutations[i]);
            values[i] = Utils.GetJaroWinklerDis(reference, nameP); 
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
