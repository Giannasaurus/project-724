using BMIS.Models.Entities;

namespace BMIS.Interfaces;

public interface IActivityLogService {
    Task<Result<ActivityLog>> Get(int logId);    
    Task<Result<int>> Log(int handlerId, string message);    
}
