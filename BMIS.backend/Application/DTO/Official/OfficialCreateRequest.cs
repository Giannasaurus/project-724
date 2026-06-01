using BMIS.Domain;

namespace BMIS.Application;

public record OfficialCreateRequest(
    Guid residentId,
    OfficialRole role
);
