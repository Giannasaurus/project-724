namespace BMIS.Application;

public record UserLogInRequest(
    string username,
    string password
);
