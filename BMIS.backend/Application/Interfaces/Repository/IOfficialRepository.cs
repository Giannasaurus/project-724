using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IOfficialRepository {
    Task<Official?> GetByResidentIdAsync(Guid residentId);

    Task<List<Official>> GetAllAsync();
    Task<List<Official>> GetFilteredAsync(OfficialFilterCriteria criteria);
    
    void Add(Official official); 
}
