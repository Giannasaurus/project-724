using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Interfaces;

public interface IResidentService {
    string GetFullName(Resident resident);

    Task<Result<Resident>> GetById(Guid id);
    Task<Result<List<Resident>>> GetAll();
    Task<Result<List<Resident>>> GetFiltered(ResidentFilterCriteria criteria);
    Task<Result<List<Resident>>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria); 

    Task<Result<Guid>> AddResident(ResidentCreateDto detail);

    Task<Result<Resident>> DeleteResident(Guid id);

    Task<Result<Resident>> UpdateResident(Guid id, ResidentUpdateDto changes);
}
