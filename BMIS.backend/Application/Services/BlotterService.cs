using BMIS.Domain.Entities;
using BMIS.Application.Interfaces;

namespace BMIS.Application.Services;

public class BlotterService : IBlotterService {
   
    public readonly IBlotterRepository _blotterRepo;
    public readonly IBlotterParticipantRepository _blotterParticipantRepo;
    public readonly IResidentRepository _residentRepo;
    public readonly IUnitOfWork _unitOfWork;

    public BlotterService(
            IUnitOfWork unitOfWork,
            IBlotterRepository blotterRepo,
            IBlotterParticipantRepository blotterParticipantRepo,
            IResidentRepository residentRepo) {

        _blotterRepo = blotterRepo;
        _blotterParticipantRepo = blotterParticipantRepo;
        _residentRepo = residentRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Blotter>> GetByIdAsync(Guid id) {
        return await _blotterRepo.GetByIdAsync(id);
    }
    
    public async Task<Result<List<Blotter>>> GetAllAsync() {
        return await _blotterRepo.GetAllAsync();
    }

    public async Task<Result<List<Blotter>>> GetFilteredAsync(BlotterFilterCriteria criteria) {
        return await _blotterRepo.GetFilteredAsync(criteria);
    }

    public async Task<Result<Guid>> AddBlotterAsync(BlotterCreateDTO details) {
        var handlerExist = await _residentRepo.DoesExistAsync(details.handlerId);
        if(!handlerExist) {
            return ResultStatus.Conflict;
        }

        var blotter = new Blotter(details.nature, details.handlerId, details.details, details.dateIssued ?? DateTime.Now);

        var participants = new List<BlotterParticipant>();
        foreach(var pDetails in details.participants) {
            var pExists = await _residentRepo.DoesExistAsync(pDetails.residentId);
            if(!pExists) {
                return ResultStatus.Conflict;
            }

            var blotterParticipant = new BlotterParticipant(pDetails.residentId, pDetails.role, blotter);
            participants.Add(blotterParticipant);
        }

        _blotterRepo.Add(blotter);
        _blotterParticipantRepo.AddRange(participants);

        await _unitOfWork.SaveChangesAsync();
        
        // TODO:
        //  error-handling
        //

        return blotter.Id;
    }
    
    public async Task<Result<Blotter>> UpdateBlotterAsync(Guid id, BlotterUpdateDTO changes) {
        var blotter = await _blotterRepo.GetByIdAsync(id); 
        if(blotter == null) {
            return ResultStatus.NotFound;
        }

        blotter.UpdateDetails(changes.details);

        await _unitOfWork.SaveChangesAsync();

        return blotter;
    }
}
