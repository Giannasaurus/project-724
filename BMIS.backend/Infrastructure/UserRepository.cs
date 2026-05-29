using Microsoft.EntityFrameworkCore;
using BMIS.Domain.Entities;
using BMIS.Application.Interfaces;

namespace BMIS.Infrastructure;

public class UserRepository : IUserRepository {
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) {
        _db = db;
    }

    public async Task<User?> GetByIdAsync(Guid id) {
        return await _db.Users.FindAsync(id); 
    }

    public async Task<User?> GetByUsernameAsync(string username) {
        return await _db.Users.SingleOrDefaultAsync(u => u.Username == username);
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
