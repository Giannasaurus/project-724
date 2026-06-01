namespace BMIS.Application;

public record UserRegistrationRequest(
    Guid residentId,
    string username,
    string password
);
