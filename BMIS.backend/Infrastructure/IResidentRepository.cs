using BMIS.Models.Entities;
using BMIS.Infrastructure.Criterias;

namespace BMIS.Application;

public interface IResidentRepository {
    Task<Resident?> GetByIdAsync(Guid id);
    Task<List<Resident>> GetAllAsync();
    Task<List<Resident>> GetFilteredAsync(ResidentFilterCriteria criteria);
    
    Task<bool> HasDuplicateAsync(Resident resident);

    void Add(Resident resident);
}


