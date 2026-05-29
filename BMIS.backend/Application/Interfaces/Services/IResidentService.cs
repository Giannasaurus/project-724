using BMIS.Domain.Entities;
using BMIS.Application;

namespace BMIS.Application.Interfaces;

public interface IResidentService {
    Task<Result<Resident>> GetById(Guid id);
    Task<Result<List<Resident>>> GetAll();
    Task<Result<List<Resident>>> GetFiltered(ResidentFilterCriteria criteria);
    Task<Result<List<Resident>>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria); 

    Task<Result<Guid>> AddResident(ResidentCreateDto detail);

    Task<Result<Resident>> UpdateResident(Guid id, ResidentUpdateDto changes);
}
