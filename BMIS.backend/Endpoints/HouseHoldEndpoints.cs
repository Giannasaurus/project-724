using Microsoft.AspNetCore.Builder;
using BMIS.Application;
using BMIS.Application.Interfaces;

namespace BMIS.Endpoints;

public static class HouseHoldEndpoints {
    public static RouteGroupBuilder MapHouseHoldEndpoints(this WebApplication app) {
        var group = app.MapGroup("/households");
        
        group.MapGet("", GetAllAsync);
        group.MapGet("/{id:int}", GetAllMembersAsync);
        group.MapPost("", CreateAsync);
        group.MapPost("/assign", AssignHeadAsync);    

        return group;
    }

    private static async Task<IResult> GetAllAsync(IHouseHoldService houseHoldService){
        var response = await houseHoldService.GetAllAsync();
        return TypedResults.Ok(response.value);
    }
    
    private static async Task<IResult> GetAllMembersAsync(int id, IHouseHoldService houseHoldService){
        var response = await houseHoldService.GetAllMembersAsync(id);
        if(response.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(response.value);
    }
    
    private static async Task<IResult> CreateAsync(HouseHoldCreateRequest request, IHouseHoldService houseHoldService){
        var response = await houseHoldService.CreateAsync(request.headId);
        if(response.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        } else if (response.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }

        return TypedResults.Created($"households/{response.value.Id}");
    }
    
    private static async Task<IResult> AssignHeadAsync(HouseHoldAssignHeadRequest request, IHouseHoldService houseHoldService){
        var response = await houseHoldService.AssignHead(request.houseHoldId, request.headId);
        if(response.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        } else if (response.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }

        return TypedResults.NoContent();
    }
}
