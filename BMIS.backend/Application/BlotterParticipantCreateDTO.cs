using BMIS.Domain;

namespace BMIS.Application;

public record BlotterParticipantUpdateDTO(
    Guid? blotterId,
    Guid? residentId,
    BlotterParticipantRole? role
);
