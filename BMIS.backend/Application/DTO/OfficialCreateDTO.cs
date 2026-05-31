using BMIS.Domain;

namespace BMIS.Application;

public record OfficialCreateDTO(
    Guid residentId,
    OfficialRole role
);
