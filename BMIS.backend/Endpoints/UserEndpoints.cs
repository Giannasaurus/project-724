using BMIS.Services;
using BMIS.Interfaces;
using BMIS.Models.DTOs;

namespace BMIS.Endpoints;

public static class UserEndpoints{
    public static void MapUserEndpoints(this WebApplication app) {
        var group = app.MapGroup("/users");

        group.MapPost("/login", Login);
        group.MapPost("/register", Register);
        group.MapPost("/update/{id}", Update);
    }

    public static async Task<IResult> Login(LogInRequest credentials, IUserService userService) {
        var results = await userService.LoginAsync(credentials);    
        
        if(!results.isSuccess) {
            return TypedResults.Conflict();
        }

        return TypedResults.Ok(new { Token = results.value });
    }
    
    public static async Task<IResult> Register(RegistrationRequest details, IUserService userService) {
        var results = await userService.RegisterAsync(details);    
        
        if(!results.isSuccess) {
            return TypedResults.Conflict();
        }

        return TypedResults.Created();
    }
    
    public static async Task<IResult> Update(Guid id, AccountUpdateRequest changes, IUserService userService) {
        var results = await userService.UpdateAsync(id, changes);    
        
        if(!results.isSuccess) {
            return TypedResults.Conflict();
        }

        return TypedResults.Ok();
    }
}
