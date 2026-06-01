using BMIS.Application.Interfaces;
using BMIS.Domain;
using BMIS.Domain.Entities;
using BMIS.Infrastructure;

namespace BMIS.Application.Services;

public class OfficialService : IOfficialService {
    private readonly IOfficialRepository _officialRepo;
    private readonly IResidentRepository _residentRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _unitOfWork;

    public OfficialService(
            IOfficialRepository officialRepo,
            IResidentRepository residentRepo,
            IUserRepository userRepo,
            IUnitOfWork unitOfWork) {

        _officialRepo = officialRepo;
        _residentRepo = residentRepo;
        _userRepo = userRepo;
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
    
    public async Task<Result<Official>> AddAsync(OfficialCreateRequest request){ 
        var residentExist= await _residentRepo.DoesExistAsync(request.residentId);
        if(!residentExist) {
            return ResultStatus.NotFound;
        }

        var official = await _officialRepo.GetByResidentIdAsync(request.residentId);
        if(official != null) {
            official.UpdateRole((OfficialRole)request.role);
        } else {
            var newOfficial = new Official(
                        request.residentId,
                        request.role,
                        true,
                        DateOnly.FromDateTime(DateTime.Now)
                    );

            _officialRepo.Add(newOfficial);
        }
        
        var user = await _userRepo.GetByResidentIdAsync(request.residentId);
        if(user != null) {
            user.Activate();
        }

        official.Activate();

        await _unitOfWork.SaveChangesAsync();
        // TODO:
        //  error-handling
        //
        
        return official;
	} 

    public async Task<Result<Official>> UpdateAsync(OfficialUpdateRequest request){ 
        var official = await _officialRepo.GetByResidentIdAsync(request.residentId);
        if(official == null) {
            return ResultStatus.NotFound;
        }

        if(request.role != null && official.Role != request.role) {
            official.UpdateRole((OfficialRole)request.role);
        }
        
        official.Activate();
        
        var user = await _userRepo.GetByResidentIdAsync(request.residentId);
        if(user != null) {
            user.Activate();
        }

        await _unitOfWork.SaveChangesAsync();
        // TODO:
        //  error-handling
        //
        
        return official;
	} 

    public async Task<Result<Official>> RemoveAsync(OfficialRemoveRequest request) {
        var official = await _officialRepo.GetByResidentIdPlainAsync(request.residentId);
        if(official == null) {
            return ResultStatus.NotFound;
        }

        var user = await _userRepo.GetByResidentIdAsync(request.residentId);
        if(user != null) {
            user.Deactivate();
        }

        official.Deactivate();
        
        Console.WriteLine(await _unitOfWork.SaveChangesAsync());
        // TODO:
        //  error-handling
        //
        
        return official;
    }
}
