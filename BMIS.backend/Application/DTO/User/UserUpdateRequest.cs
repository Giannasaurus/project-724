namespace BMIS.Application;

public record UserUpdateRequest(
    string? username,
    string? password
);
