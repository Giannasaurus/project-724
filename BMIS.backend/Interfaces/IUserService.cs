
using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Interfaces;

public interface IUserService {
    Task<Result<string?>> LoginAsync(LogInRequest credentials);

    Task<Result<Guid>> RegisterAsync(RegistrationRequest details);
    Task<Result<Guid>> UpdateAsync(Guid id, AccountUpdateRequest changes);
}
