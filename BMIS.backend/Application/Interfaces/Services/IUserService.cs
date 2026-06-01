using BMIS.Domain.Entities;
using BMIS.Application;

namespace BMIS.Application.Interfaces;

public interface IUserService {
    Task<Result<string?>> LoginAsync(UserLogInRequest credentials);

    Task<Result<Guid>> RegisterAsync(UserRegistrationRequest details);
    Task<Result<Guid>> UpdateAsync(Guid residentId, UserUpdateRequest changes);
    Task<Result<string>> RecoverAsync(string username, string recovery);
}
