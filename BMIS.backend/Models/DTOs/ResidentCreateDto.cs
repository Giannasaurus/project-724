namespace BMIS.Models.DTOs;

public record ResidentCreateDto (
    string firstName,
    string? middleName,
    string lastName,
    string? suffix,
    DateOnly birthDate,
    Sector sector,
    Sex sex,
    CivilStatus civilStatus,
    string address,
    string contact,
    int houseHoldId
);
