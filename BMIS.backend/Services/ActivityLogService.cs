using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;

namespace BMIS.Services;

public class ActivityLogService : IActivityLogService {
    public readonly AppDbContext _db;

    public ActivityLogService(AppDbContext db) {
        _db = db;
    }

    public async Task<Result<ActivityLog>> Get(int logId) {
        var log = await _db.ActivityLogs.FindAsync(logId);

        if(log == null){
            return ResultStatus.NotFound;
        }

        return log;
    }

    public async Task<Result<int>> Log(int handlerId, string message) {
        var handler = await _db.Residents.FindAsync(handlerId);
        if(handler == null) {
            return ResultStatus.NotFound;
        }

        var activityLog = new ActivityLog(handlerId, message);
        try {
            _db.ActivityLogs.Add(activityLog);
            await _db.SaveChangesAsync();
        } catch (DbUpdateException e) {
            Console.WriteLine($"[!] problem saving {string.Join(" ", e.Entries)}");

            return ResultStatus.Conflict; 
        }

        return activityLog.Id;
    }
}
