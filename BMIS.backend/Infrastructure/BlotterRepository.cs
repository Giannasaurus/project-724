using Microsoft.EntityFrameworkCore;

using BMIS.Domain;
using BMIS.Domain.Entities;
using BMIS.Application;
using BMIS.Application.Interfaces;

namespace BMIS.Infrastructure;

public class BlotterRepository : IBlotterRepository {

    public readonly AppDbContext _db;

    public BlotterRepository(AppDbContext db) {
        _db = db;
    }

    public async Task<Blotter?> GetByIdAsync(Guid id) {
        return await _db.Blotters.FindAsync(id);
    }

    public async Task<List<Blotter>> GetAllAsync() {
        return await _db.Blotters.AsNoTracking().ToListAsync();
    }

    public async Task<List<Blotter>> GetFilteredAsync(BlotterFilterCriteria criteria) {
        var blotters = _db.Blotters.AsNoTracking();
        

        var dateFrom = criteria.from ?? DateTime.Now.AddYears(-999);
        var dateTo = criteria.to ?? DateTime.Now;
        blotters = blotters.Where(r => r.DateIssued >= dateFrom && r.DateIssued <= dateTo);

        var natures = criteria.natures.ToList();
        if(natures.Any()) {
            var valid = new HashSet<BlotterNature>();
            foreach(var n in criteria.natures) {
                if(Enum.TryParse<BlotterNature>(n, true, out BlotterNature parsed)) {
                    valid.Add(parsed);
                }
            }
            
            blotters = blotters.Where(r => valid.Contains(r.Nature));
        }
        
        return await blotters.ToListAsync(); 
    }

    public void Add(Blotter blotter) {
        _db.Blotters.Add(blotter);
    }
} 
