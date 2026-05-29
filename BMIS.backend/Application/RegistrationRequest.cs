namespace BMIS.Application;

public record RegistrationRequest(
    Guid residentId,
    string username,
    string password
);
