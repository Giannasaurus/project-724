using BMIS.Services;
using BMIS.Interfaces;

namespace BMIS.Endpoints;

public static class ActivityLogEndpoints {
    public static void MapActivityLogEndpoints(this WebApplication app) {
        var group = app.MapGroup("/logs");
    }


    public static async Task<IResult> GetLog(int id, IActivityLogService activityLogService) {
        var results = await activityLogService.Get(id);    
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(results.value);
    }
    
    public static async Task<IResult> Create(Guid handlerId, string message, IActivityLogService activityLogService) {
        var results = await activityLogService.Log(handlerId, message);    
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(results.value);
    }
}
