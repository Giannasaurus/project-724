using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IHouseHoldRepository {
    Task<HouseHold?> GetByIdAsync(int id);
    Task<List<HouseHold>> GetAllAsync();
    
    void Add(HouseHold houseHold);
}
