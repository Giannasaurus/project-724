using Microsoft.EntityFrameworkCore;
using BMIS.Domain.Entities;
using BMIS.Application.Interfaces;

namespace BMIS.Infrastructure;

public class BlotterParticipantRepository : IBlotterParticipantRepository {

    public readonly AppDbContext _db;

    public BlotterParticipantRepository(AppDbContext db) {
        _db = db;
    }

    public async Task<BlotterParticipant> GetByIdAsync(Guid blotterId, Guid residentId) {
        return await _db.BlotterParticipants.FindAsync(blotterId, residentId);
    }

    public async Task<List<BlotterParticipant>> GetAllAsync() {
        return await _db.BlotterParticipants.AsNoTracking().ToListAsync();
    }

    public void Add(BlotterParticipant participant) {
        _db.BlotterParticipants.Add(participant);
    }

    public void AddRange(List<BlotterParticipant> participants) {
        _db.BlotterParticipants.AddRange(participants);
    }
}
