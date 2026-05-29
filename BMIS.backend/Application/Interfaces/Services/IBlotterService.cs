using BMIS.Domain.Entities;
using BMIS.Application;

namespace BMIS.Application.Interfaces;

public interface IBlotterService {
    Task<Result<Blotter>> GetByIdAsync(Guid id);
    Task<Result<List<Blotter>>> GetAllAsync();
    Task<Result<List<Blotter>>> GetFilteredAsync(BlotterFilterCriteria criteria);

    Task<Result<Guid>> AddBlotterAsync(BlotterCreateDTO details);
    
    Task<Result<Blotter>> UpdateBlotterAsync(Guid id, BlotterUpdateDTO changes);
}
