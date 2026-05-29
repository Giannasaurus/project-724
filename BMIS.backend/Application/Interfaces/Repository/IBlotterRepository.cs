using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IBlotterRepository {
    Task<Blotter?> GetByIdAsync(Guid id);

    Task<List<Blotter>> GetAllAsync();
    Task<List<Blotter>> GetFilteredAsync(BlotterFilterCriteria criteria);

    void Add(Blotter blotter);
}
