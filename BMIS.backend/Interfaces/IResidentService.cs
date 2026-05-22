using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Interfaces;

public interface IResidentService {
    string GetFullName(Resident resident);

    Task<Result<Resident>> GetById(int id);
    Task<Result<List<Resident>>> GetAll();
    Task<Result<List<Resident>>> GetFiltered(ResidentFilterCriteria criteria);
    Task<Result<List<Resident>>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria); 

    Task<Result<int>> AddResident(ResidentCreateDto detail);

    Task<Result<Resident>> DeleteResident(int id);

    Task<Result<Resident>> UpdateResident(int id, ResidentUpdateDto changes);
}
