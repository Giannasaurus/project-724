using BMIS.Domain;

namespace BMIS.Application;

public record OfficialRemoveRequest(
    Guid residentId
);
