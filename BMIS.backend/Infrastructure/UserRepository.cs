using Microsoft.EntityFrameworkCore;
using BMIS.Domain.Entities;
using BMIS.Application.Interfaces;

namespace BMIS.Infrastructure;

public class UserRepository : IUserRepository {
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) {
        _db = db;
    }

    public async Task<User?> GetByResidentIdAsync(Guid residentId) {
        return await _db.Users
            .Include(u => u.OfficialInfo)
            .FirstOrDefaultAsync(u => u.ResidentId == residentId);
    }

    public async Task<User?> GetByUsernameAsync(string username) {
        return await _db.Users
            .Include(u => u.OfficialInfo)
            .ThenInclude(o => o.ResidentInfo)
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<bool> HasDuplicateAsync(string username) {
        return await _db.Users.AsNoTracking().AnyAsync(u => u.Username == username);
    }
    
    public async Task<bool> HasDuplicateAsync(Guid id) {
        return await _db.Users.AsNoTracking().AnyAsync(u => u.ResidentId == id);
    }

    public void Add(User user) {
        _db.Users.Add(user);
    }
}
