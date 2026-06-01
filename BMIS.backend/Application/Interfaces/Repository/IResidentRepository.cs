using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IResidentRepository {
    Task<Resident?> GetByIdAsync(Guid id);
    Task<List<Resident>> GetAllAsync();
    Task<List<Resident>> GetFilteredAsync(ResidentFilterCriteria criteria);
    
    Task<bool> DoesExistAsync(Guid id);
    Task<bool> HasDuplicateAsync(Resident resident);

    void Add(Resident resident);
}


