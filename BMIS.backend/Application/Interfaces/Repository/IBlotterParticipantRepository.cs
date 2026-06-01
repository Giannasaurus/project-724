using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IBlotterParticipantRepository {
    Task<BlotterParticipant> GetByIdAsync(Guid blotterId, Guid residentId);

    Task<List<BlotterParticipant>> GetByBlotterIdAsync(Guid blotterId);
    Task<List<BlotterParticipant>> GetAllAsync();
    Task<List<BlotterParticipant>> GetFilteredAsync(BlotterParticipantFilterCriteria criteria);

    void Add(BlotterParticipant participant);
    void AddRange(List<BlotterParticipant> participants);
}
