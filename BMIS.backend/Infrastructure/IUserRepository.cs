using BMIS.Models.Entities;
using BMIS.Infrastructure.Criterias;

namespace BMIS.Application;

public interface IUserRepository {
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByUsernameAsync(string username); 
    Task<bool> HasDuplicateAsync(string username);
    Task<bool> HasDuplicateAsync(Guid id);

    void Add(User user);
}
