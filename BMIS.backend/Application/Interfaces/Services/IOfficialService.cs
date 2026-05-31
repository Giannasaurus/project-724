using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IOfficialService {
    Task<Result<Official?>> GetByResidentIdAsync(Guid residentId);

    Task<Result<List<Official>>> GetAllAsync();
    Task<Result<List<Official>>> GetFilteredAsync(OfficialFilterCriteria criteria);
    
    Task<Result<Official>> AddAsync(OfficialCreateDTO details); 
    Task<Result<Official>> UpdateAsync(Guid residentId, OfficialUpdateDTO changes); 
}
