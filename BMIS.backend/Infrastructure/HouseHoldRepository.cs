using Microsoft.EntityFrameworkCore;
using BMIS.Domain.Entities;
using BMIS.Application.Interfaces;

namespace BMIS.Infrastructure;

public class HouseHoldRepository : IHouseHoldRepository {
    private readonly AppDbContext _db;

    public HouseHoldRepository(AppDbContext db) {
        _db = db;
    }

    public async Task<HouseHold?> GetByIdAsync(int id) {
        return await _db.HouseHolds.FindAsync(id);
    }
    
    public async Task<List<HouseHold>> GetAllAsync() {
        return await _db.HouseHolds.AsNoTracking().ToListAsync(); 
    }
    
    public void Add(HouseHold houseHold) {
        _db.HouseHolds.Add(houseHold); 
    }
}
