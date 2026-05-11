using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Services;

public interface IResidentService {
    Task<Result<Resident>> GetById(int id);
    Task<Result<List<Resident>>> GetAll();
    Task<Result<List<Resident>>> GetFiltered(ResidentFilterCriteria criteria);
    Task<Result<List<Resident>>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria); 

    Task<Result<int>> Create(Resident resident);
}
