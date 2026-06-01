using Microsoft.EntityFrameworkCore;
using BMIS.Domain;
using BMIS.Domain.Entities;
using BMIS.Application;
using BMIS.Application.Interfaces;

namespace BMIS.Infrastructure;

public class OfficialRepository : IOfficialRepository {
    private readonly AppDbContext _db;

    public OfficialRepository(AppDbContext db) {
        _db = db;
    }

    public async Task<Official?> GetByResidentIdAsync(Guid residentId) {
        return await _db.Officials
            .Include(o => o.ResidentInfo)
            .FirstOrDefaultAsync(o => o.ResidentId == residentId);
    }

    public async Task<Official?> GetByResidentIdPlainAsync(Guid residentId) {
        return await _db.Officials.FindAsync(residentId);
    }

    public async Task<List<Official>> GetAllAsync() {
        return await _db.Officials.AsNoTracking().ToListAsync();
    }
    
    public async Task<List<Official>> GetFilteredAsync(OfficialFilterCriteria criteria) {
        var officials = _db.Officials.AsNoTracking();

        if(criteria.roles != null && criteria.roles.Length > 0) {
            var valid = new HashSet<OfficialRole>();
            foreach(var role in criteria.roles) {
                if(Enum.TryParse(role, false, out OfficialRole parsed)) {
                    valid.Add(parsed);
                }
            }

            officials = officials.Where(o => valid.Contains(o.Role));
        }

        return await officials.ToListAsync();
    }
    
    public void Add(Official official) {
        _db.Officials.Add(official);
    }
}
