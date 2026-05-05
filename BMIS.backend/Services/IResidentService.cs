using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Services;

public interface IResidentService {
    Task<List<Resident>> GetAllResidents();
    Task<List<Resident>> GetFilteredResidents(ResidentFilterCriteria criteria);
    Task<List<Resident>> GetSearchResidentResults(SearchRequest search, ResidentFilterCriteria criteria); 
}
