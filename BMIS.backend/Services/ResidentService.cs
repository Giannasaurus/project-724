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
    
    public string GetFullName(Resident resident){
        string name = $"{resident.LastName}, {resident.FirstName}";
        
        if(!string.IsNullOrEmpty(resident.MiddleName)) {
            name += $" {resident.MiddleName[0]}.";
        }

        if(!string.IsNullOrEmpty(resident.Suffix)) {
            name += $", {resident.Suffix}";
        }

        return name;
    }

    public async Task<Result<List<Resident>>> GetAll() {
        var value = await _db.Residents.AsNoTracking().ToListAsync();
        return value;
    }

    public async Task<Result<Resident>> GetById(Guid id) {
        var value = await _db.Residents.FindAsync(id);
        if(value == null) {
            return ResultStatus.NotFound;
        } 

        return value;
    }

    public async Task<Result<List<Resident>>> GetFiltered(ResidentFilterCriteria criteria) {
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
        var paginize = Utils.GetListRange(results, criteria.from, criteria.limit);

        return paginize;
    } 
    
    public async Task<Result<List<Resident>>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria) {
        var residents = FilterResidents(criteria)
                            .Select(r => new { Resident = r, Score = GetSimilarityScore(search.query, GetFullName(r)) })
                            .OrderByDescending(r => r.Score)
                            .ThenBy(r => GetFullName(r.Resident))
                            .Select(r => r.Resident);
        
        var paginize = Utils.GetListRange<Resident>(await residents.ToListAsync(), criteria.from, criteria.limit);
        
        return paginize;
    }


    // TODO: 
    //  add logging
    //  check required attributes if null before procceding
    // 
    public async Task<Result<Guid>> AddResident(ResidentCreateDto details) {
        Resident resident = new Resident() {
            FirstName = details.firstName,
            MiddleName = details.middleName,
            LastName = details.lastName,
            Suffix = details.suffix,
            BirthDate = details.birthDate,
            Sex = details.sex,
            CivilStatus = details.civilStatus,
            Address = details.address,
            Phone = details.phone,
            Email = details.email,
            IsHead = details.isHead,
            HouseHoldId= details.houseHoldId,
        };

        if(HasDuplicate(resident)) {
            return ResultStatus.Conflict;
        }

        _db.Add(resident);
        
        try {
            await _db.SaveChangesAsync();
            Console.WriteLine("[~] save successful");
        } catch (DbUpdateException e) {
            Console.WriteLine($"[!] problem saving {string.Join(" ", e.Entries)}");

            return ResultStatus.Conflict; 
        }
        
        return resident.Id;
    }

    /*
     * TODO: 
     *  - should have a history of deletion, and should also be recovered
     *
     */
    public async Task<Result<Resident>> DeleteResident(Guid id) {
        var resident = await _db.Residents.FindAsync(id);

        if(resident is null) {
            return ResultStatus.NotFound;
        }

        /*
         *  SHOULD BACKUP BEFORE DELETE
         *
         */

        _db.Residents.Remove(resident);
        
        /*
         *  SHOULD BACKUP AFTER DELETE
         *
         */
        try {
            await _db.SaveChangesAsync();
            Console.WriteLine("[~] save successful");
        } catch (DbUpdateException e) {
            Console.WriteLine("[!] error saving");
        }

        return resident; 
    }


    // TODO: 
    //  add logging
    //  check required attributes if null before procceding
    // 
    public async Task<Result<Resident>> UpdateResident(Guid id, ResidentUpdateDto changes) {
        var resident = await _db.Residents.FindAsync(id);

        if(resident is null) {
            return ResultStatus.NotFound;
        }

        if(changes.firstName != null) resident.FirstName = changes.firstName;
        if(changes.middleName != null) resident.MiddleName = changes.middleName;
        if(changes.lastName != null) resident.LastName = changes.lastName;
        if(changes.suffix != null) resident.Suffix = changes.suffix;

        if(changes.birthDate != null) resident.BirthDate = (DateOnly)changes.birthDate;
        if(changes.sex != null) resident.Sex = (Sex)changes.sex;
        if(changes.civilStatus != null) resident.CivilStatus = (CivilStatus)changes.civilStatus;

        if(changes.address != null) resident.Address = changes.address;
        if(changes.phone != null) resident.Phone = changes.phone;
        if(changes.email != null) resident.Email = changes.email;

        if(changes.isHead != null) resident.IsHead = (bool)changes.isHead;
        if(changes.houseHoldId != null) resident.HouseHoldId = (int)changes.houseHoldId;

        return resident;
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
       
        //
        //  TODO: 
        //      add filtering of Senior/ PWDs
        //

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

    public double GetSimilarityScore(string reference, string candidate) {
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

    private bool HasDuplicate(Resident resident) {
        string reference = GetFullName(resident); 
        var similar = _db.Residents.AsNoTracking()
                            .Where(r => reference == r.ToString()); 

        return similar.Any();    
    }
}
