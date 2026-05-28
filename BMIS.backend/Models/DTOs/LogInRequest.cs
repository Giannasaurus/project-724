namespace BMIS.Models.DTOs;

public record LogInRequest(
    string username,
    string password
);
