namespace BMIS.Models.DTOs;

public record AccountUpdateRequest(
    Guid? residentId,
    string? username,
    string? password
);
