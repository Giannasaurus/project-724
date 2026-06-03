using BMIS.Application.Interfaces;
using BMIS.Domain.Entities;

namespace BMIS.Application.Services;

public class HouseHoldService : IHouseHoldService {
    private readonly IHouseHoldRepository _houseHoldRepo;
    private readonly IResidentRepository _residentRepo;
    private readonly IUnitOfWork _unitOfWork;

    public HouseHoldService(
    		IHouseHoldRepository houseHoldRepo,
    		IResidentRepository residentRepo,
    		IUnitOfWork unitOfWork ) {
    
        _houseHoldRepo = houseHoldRepo;
        _residentRepo = residentRepo;
        _unitOfWork = unitOfWork;

    }

    public async Task<Result<List<HouseHold>>> GetAllAsync() {
        return await _houseHoldRepo.GetAllAsync();
	}

    public async Task<Result<List<Resident>>> GetAllMembersAsync(int houseHoldId) {
        return await _residentRepo.GetWithHouseHoldId(houseHoldId);
	}

    public async Task<Result<HouseHold>> CreateAsync(Guid headId) {
        var head = await _residentRepo.GetByIdAsync(headId);
        if(head == null) {
            return ResultStatus.NotFound;
        }
        
        if(head.IsHead) {
            return ResultStatus.Conflict;
        }

        var houseHold = new HouseHold(headId);
        head.UpdateHouseHold(houseHold, true);
        _houseHoldRepo.Add(houseHold);
        
        await _unitOfWork.SaveChangesAsync();
        // TODO:
        //  error-handling
        //
    
        return houseHold;
	}

    public async Task<Result<HouseHold>> AssignHead(int houseHoldId, Guid newHeadId) {
        var houseHold = await _houseHoldRepo.GetByIdAsync(houseHoldId);
        if(houseHold == null) {
            return ResultStatus.NotFound;
        }

        var members = await _residentRepo.GetWithHouseHoldId(houseHoldId);
        if(!members.Any()) {
            return ResultStatus.Conflict; 
        }

        foreach(var member in members) {
            member.UpdateHouseHold(houseHoldId, false);
        }

        foreach(var member in members) {
            if(member.Id == newHeadId) {
                member.UpdateHouseHold(houseHoldId, true);
                break;
            }
        }
        
        await _unitOfWork.SaveChangesAsync();
        // TODO:
        //  error-handling
        //
        
        return houseHold;
	}

    public async Task<Result<HouseHold>> DissolveAsync(int houseHoldId) {
        // WARNING: 
        //  not implemented
        //
        
        return await _houseHoldRepo.GetByIdAsync(houseHoldId); 
	}
}
















