using Microsoft.EntityFrameworkCore;
using BMIS.Domain;
using BMIS.Domain.Entities;
using BMIS.Application;
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
    
    public async Task<List<BlotterParticipant>> GetByBlotterIdAsync(Guid blotterId) {
        return await _db.BlotterParticipants.AsNoTracking()
                                            .Where(e => e.BlotterId == blotterId)
                                            .ToListAsync();
    }

    public async Task<List<BlotterParticipant>> GetAllAsync() {
        return await _db.BlotterParticipants.AsNoTracking().ToListAsync();
    }
    
    public async Task<List<BlotterParticipant>> GetFilteredAsync(BlotterParticipantFilterCriteria criteria) {
        var participants = _db.BlotterParticipants.AsNoTracking();

        var roles = criteria.roles.ToList();
        if(roles.Any()) {
            var valid = new HashSet<BlotterParticipantRole>();
            foreach(var role in roles) {
                if(Enum.TryParse(role, false, out BlotterParticipantRole parsed)) {
                    valid.Add(parsed);
                }
            }

            participants = participants.Where(p => valid.Contains(p.Role));
        }

        return await participants.ToListAsync();
    }

    public void Add(BlotterParticipant participant) {
        _db.BlotterParticipants.Add(participant);
    }

    public void AddRange(List<BlotterParticipant> participants) {
        _db.BlotterParticipants.AddRange(participants);
    }
}
