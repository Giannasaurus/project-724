using Microsoft.AspNetCore.Builder;
using BMIS.Application;
using BMIS.Application.Interfaces;
using BMIS.Domain.Entities;

namespace BMIS.Endpoints;

public static class UserEndpoints{
    public static RouteGroupBuilder MapUserEndpoints(this WebApplication app) {
        var group = app.MapGroup("/users");

        group.MapPost("/login", Login);
        group.MapPost("/register", Register);
        group.MapPost("/update/{id}", Update);
        group.MapPost("/recover/{id}", Recover);
        
        return group;
    }

    public static async Task<IResult> Login(UserLogInRequest credentials, IUserService userService) {
        var results = await userService.LoginAsync(credentials);    

        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        } else if(results.code == ResultStatus.Unauthorized) {
            return TypedResults.Unauthorized();
        } else if(results.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }

        return TypedResults.Ok(new { Token = results.value });
    }
    
    public static async Task<IResult> Register(UserRegistrationRequest details, IUserService userService) {
        var results = await userService.RegisterAsync(details);    

        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        } else if(results.code == ResultStatus.Unauthorized) {
            return TypedResults.Unauthorized();
        } else if(results.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }

        return TypedResults.Created();
    }
    
    public static async Task<IResult> Update(Guid id, UserUpdateRequest changes, IUserService userService) {
        var results = await userService.UpdateAsync(id, changes);    

        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        } else if(results.code == ResultStatus.Unauthorized) {
            return TypedResults.Unauthorized();
        } else if(results.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }

        return TypedResults.Ok();
    }
    
    public static async Task<IResult> Recover(string username, string recovery, IUserService userService) {
        var results = await userService.RecoverAsync(username, recovery);    

        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound();
        } else if(results.code == ResultStatus.Unauthorized) {
            return TypedResults.Unauthorized();
        } else if(results.code == ResultStatus.Conflict) {
            return TypedResults.Conflict();
        }

        return TypedResults.Ok(results.value);
    }
}
