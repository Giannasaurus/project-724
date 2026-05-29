using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IBlotterParticipantRepository {
    Task<BlotterParticipant> GetByIdAsync(Guid blotterId, Guid residentId);

    Task<List<BlotterParticipant>> GetAllAsync();

    void Add(BlotterParticipant participant);
    void AddRange(List<BlotterParticipant> participants);
}
