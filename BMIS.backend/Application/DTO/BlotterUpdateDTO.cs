using BMIS.Domain;

namespace BMIS.Application;

public record BlotterUpdateDTO(
    DateTime? dateIssued,
    BlotterNature? nature,
    string? details,
    Guid? handlerId,
    List<BlotterParticipantCreateDTO>? participants 
);
