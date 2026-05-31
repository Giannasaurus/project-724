using BMIS.Application.Interfaces;
using BMIS.Domain;
using BMIS.Domain.Entities;
using BMIS.Infrastructure;

namespace BMIS.Application.Services;

public class OfficialService : IOfficialService {
    private readonly IOfficialRepository _officialRepo;
    private readonly IResidentRepository _residentRepo;
    private readonly IUnitOfWork _unitOfWork;

    public OfficialService(
            IOfficialRepository officialRepo,
            IResidentRepository residentRepo,
            IUnitOfWork unitOfWork) {

        _officialRepo = officialRepo;
        _residentRepo = residentRepo;
        _unitOfWork = unitOfWork;
    
    }

    public async Task<Result<Official?>> GetByResidentIdAsync(Guid residentId) {
        var result = await _officialRepo.GetByResidentIdAsync(residentId); 
        if(result == null) {
            return ResultStatus.NotFound;
        }

        return result;    
    }

    public async Task<Result<List<Official>>> GetAllAsync(){ 
        return await _officialRepo.GetAllAsync();
	}
    public async Task<Result<List<Official>>> GetFilteredAsync(OfficialFilterCriteria criteria){ 
        return await _officialRepo.GetFilteredAsync(criteria);
	}
    
    public async Task<Result<Official>> AddAsync(OfficialCreateDTO details){ 
        var exist = await _residentRepo.DoesExistAsync(details.residentId);
        if(!exist) {
            return ResultStatus.NotFound;
        }

        var official = new Official(details.residentId, details.role);

        _officialRepo.Add(official);
        await _unitOfWork.SaveChangesAsync();
        // TODO:
        //  error-handling
        //
        
        return official;
	} 

    public async Task<Result<Official>> UpdateAsync(Guid residentId, OfficialUpdateDTO changes){ 
        var official = await _officialRepo.GetByResidentIdAsync(residentId);
        if(official == null) {
            return ResultStatus.NotFound;
        }

        if(changes.role != null) {
            official.UpdateRole((OfficialRole)changes.role);
        }

        await _unitOfWork.SaveChangesAsync();
        // TODO:
        //  error-handling
        //
        
        return official;
	} 

}
