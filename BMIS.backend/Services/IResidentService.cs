using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Services;

public interface IResidentService {
    Task<Resident?> GetById(int id);
    Task<List<Resident>> GetAll();
    Task<List<Resident>> GetFiltered(ResidentFilterCriteria criteria);
    Task<List<Resident>> GetSearchResults(SearchRequest search, ResidentFilterCriteria criteria); 

    void Create(Resident resident);
}
