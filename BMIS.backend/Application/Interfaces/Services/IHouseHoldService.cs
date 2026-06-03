using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IHouseHoldService {
    Task<Result<List<HouseHold>>> GetAllAsync();
    Task<Result<List<Resident>>> GetAllMembersAsync(int houseHoldId);
    Task<Result<HouseHold>> CreateAsync(Guid headId);
    Task<Result<HouseHold>> AssignHead(int houseHoldId, Guid newHeadId);
    Task<Result<HouseHold>> DissolveAsync(int houseHoldId);
}
