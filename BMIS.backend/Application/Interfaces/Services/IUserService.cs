using BMIS.Domain.Entities;
using BMIS.Application;

namespace BMIS.Application.Interfaces;

public interface IUserService {
    Task<Result<string?>> LoginAsync(LogInRequest credentials);

    Task<Result<Guid>> RegisterAsync(RegistrationRequest details);
    Task<Result<Guid>> UpdateAsync(Guid id, AccountUpdateRequest changes);
}
