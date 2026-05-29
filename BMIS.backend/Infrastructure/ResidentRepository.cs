using Microsoft.EntityFrameworkCore;

using BMIS.Domain.Entities;
using BMIS.Application;
using BMIS.Application.Interfaces;

namespace BMIS.Infrastructure;

public class ResidentRepository : IResidentRepository {
    public readonly AppDbContext _db; 

    public ResidentRepository(AppDbContext db) {
        _db = db;
    }
    
    public async Task<Resident?> GetByIdAsync(Guid id) {
        return await _db.Residents.FindAsync(id);
    }

    public async Task<List<Resident>> GetAllAsync() {
        return await _db.Residents.AsNoTracking().ToListAsync();
    }

    public async Task<List<Resident>> GetFilteredAsync(ResidentFilterCriteria criteria) {
        return await _db.Residents.AsNoTracking()
                            .ApplyHeadFilter(criteria.isHead)
                            .ApplySexFilter(criteria.sex.ToList())
                            .ApplySeniorFilter(criteria.isSenior)
                            .ApplyPWDFilter(criteria.isPwd)
                            .ApplyAgeFilter(criteria.minAge, criteria.maxAge)
                            .ApplyCivilStatusFilter(criteria.civilStatus.ToList())
                            .ToListAsync();

        // TODO: 
        //  civil status filter not implemented
        //
    }

    public async Task<bool> DoesExistAsync(Guid id) {
        return await _db.Residents.AnyAsync(r => r.Id == id);
    }

    public async Task<bool> HasDuplicateAsync(Resident resident) {
        return await _db.Residents.AsNoTracking()
                            .AnyAsync(r => r.FirstName == resident.FirstName &&
                                           r.MiddleName == resident.MiddleName && 
                                           r.LastName == resident.LastName &&
                                           r.Suffix == resident.Suffix);
    }

    public void Add(Resident resident) {
        _db.Residents.Add(resident);
    }
}
