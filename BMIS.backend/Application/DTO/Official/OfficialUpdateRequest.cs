using BMIS.Domain;

namespace BMIS.Application;

public record OfficialUpdateRequest(
    Guid residentId,
    OfficialRole? role
);
