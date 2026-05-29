using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IActivityLogService {
    Task<Result<ActivityLog>> Get(int logId);    
    Task<Result<int>> Log(Guid handlerId, string message);    
}
