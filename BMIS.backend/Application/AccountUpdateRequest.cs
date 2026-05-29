namespace BMIS.Application;

public record AccountUpdateRequest(
    Guid? residentId,
    string? username,
    string? password
);
