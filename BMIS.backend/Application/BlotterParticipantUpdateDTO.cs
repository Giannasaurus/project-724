using BMIS.Domain;

namespace BMIS.Application;

public record BlotterParticipantCreateDTO(
    Guid? blotterId,
    Guid residentId,
    BlotterParticipantRole role
);
