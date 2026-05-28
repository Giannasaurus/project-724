namespace BMIS.Models.DTOs;

public record RegistrationRequest(
    Guid residentId,
    string username,
    string password
);
