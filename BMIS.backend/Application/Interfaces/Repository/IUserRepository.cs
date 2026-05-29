using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IUserRepository {
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByUsernameAsync(string username); 
    Task<bool> HasDuplicateAsync(string username);
    Task<bool> HasDuplicateAsync(Guid id);

    void Add(User user);
}
