
using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Interfaces;

public interface IUserService {
    Task<Result<string?>> LoginAsync(string username, string password);

    Task<Result<Guid>> RegisterAsync(Guid residentId, string username, string password);
}
