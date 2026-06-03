using Microsoft.EntityFrameworkCore;
using BMIS.Domain;
using BMIS.Domain.Entities;
using BMIS.Application;
using BMIS.Application.Interfaces;

namespace BMIS.Application.Services;

public class ResidentService : IResidentService, ISearchable {

    public readonly IUnitOfWork _unitOfWork;
    public readonly IResidentRepository _residentRepo;
    public readonly IHouseHoldRepository _houseHoldRepo;

    public ResidentService(
            IUnitOfWork unitOfWork,
            IResidentRepository residentRepo,
            IHouseHoldRepository houseHoldRepo ) {

        _unitOfWork = unitOfWork;
        _residentRepo = residentRepo;
        _houseHoldRepo = houseHoldRepo;
    
    }

    public async Task<Result<List<Resident>>> GetAll() {
        return await _residentRepo.GetAllAsync();
    }

    public async Task<Result<Resident>> GetById(Guid id) {
        var value = await _residentRepo.GetByIdAsync(id);
        if(value == null) {
            return ResultStatus.NotFound;
        } 

        return value;
    }

    public async Task<Result<List<Resident>>> GetFiltered(ResidentFilterCriteria criteria) {
        var results = await _residentRepo.GetFilteredAsync(criteria);
        var paginize = Utils.GetListRange(results, criteria.from, criteria.limit);

        return paginize;
    } 
    
    public async Task<Result<List<Resident>>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria) {
        var filtered = await _residentRepo.GetFilteredAsync(criteria);
        var ranked = filtered.Select(r => new { 
                                Resident = r,
                                FullName = r.ToString(),
                                Score = GetSimilarityScore(search.query, r.ToString())
                            })
                        .Where(r => r.Score >= 0.1)
                        .OrderByDescending(r => r.Score)
                        .ThenBy(r => r.FullName) 
                        .Select(r => r.Resident)
                        .ToList();
        
        var paginize = Utils.GetListRange<Resident>(ranked, criteria.from, criteria.limit);
        
        return paginize;
    }


    // TODO: 
    //  add logging
    //  check required attributes if null before procceding
    //  fix household problem (what if the household doesn't exist)
    // 
    public async Task<Result<Guid>> AddResident(ResidentCreateDto details) {
        // TODO:
        //  check a household shouldnt have multiple heads
        //
        //
        

        var residentBuilder = new Resident.Builder()
            .WithName(details.firstName, details.middleName, details.lastName, details.suffix)
            .BornOn(details.birthDate, details.birthPlace, details.sex, details.citizenship)
        //    .InHouseHold(details.houseHoldId)
            .WithCivilStatus(details.civilStatus)
            .InBeliefOf(details.religion)
            .ResidingAt(details.address)
            .WithContactInfo(details.phone, details.email);

        if(details.houseHoldId == null) {
            var houseHold = new HouseHold();
            residentBuilder = residentBuilder.InHouseHold(houseHold).AsHouseHoldHead();
        } else {
            var houseHold = await _houseHoldRepo.GetByIdAsync((int)details.houseHoldId);
            if(houseHold == null) {
                if(!details.isHead) {
                    return ResultStatus.NotFound;
                }

                houseHold = new HouseHold((int)details.houseHoldId);
                residentBuilder = residentBuilder.AsHouseHoldHead(); 
            }

            residentBuilder = residentBuilder.InHouseHold(houseHold);
        }
        
        if(details.isSenior) {
            residentBuilder = residentBuilder.AsSenior();
        }

        if(details.isPwd) {
            residentBuilder = residentBuilder.AsSenior();
        }

        Resident resident = residentBuilder.Build();

        if(resident == null) {
            Console.WriteLine("[!] error: resident creation error"); 
            
            return ResultStatus.Conflict;
        }

        bool hasDuplicate = await _residentRepo.HasDuplicateAsync(resident);

        if(hasDuplicate) {
            Console.WriteLine("[!] error: duplicate resident"); 
            
            return ResultStatus.Conflict;
        }

        _residentRepo.Add(resident);

        await _unitOfWork.SaveChangesAsync();

        // TODO: 
        //  implement error-handling

        return resident.Id;
    }

    public async Task<Result<Resident>> UpdateResident(Guid id, ResidentUpdateDto changes) {
        var resident = await _residentRepo.GetByIdAsync(id);

        if(resident is null) {
            return ResultStatus.NotFound;
        }

        resident.UpdateName(changes.firstName, changes.middleName, changes.lastName, changes.suffix);
        resident.UpdateBirth(changes.birthDate, changes.birthPlace, changes.sex, changes.citizenship);
        resident.UpdateSeniorStatus(changes.isSenior);
        resident.UpdatePWDStatus(changes.isPwd);
        resident.UpdateCivilStatus(changes.civilStatus);
        resident.UpdateReligion(changes.religion);
        resident.UpdateContactInfo(changes.phone, changes.email);
        resident.UpdateHouseHold(changes.houseHoldId, changes.isHead);

        await _unitOfWork.SaveChangesAsync();

        return resident;
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
}
