namespace BMIS.Models.DTOs;

public record ResidentUpdateDto (
    string? firstName,
    string? middleName,
    string? lastName,
    string? suffix,

    DateOnly? birthDate,
    Sex? sex,
    CivilStatus? civilStatus,

    string? address,
    string? phone,
    string? email,

    bool? isHead,
    int? houseHoldId
);
