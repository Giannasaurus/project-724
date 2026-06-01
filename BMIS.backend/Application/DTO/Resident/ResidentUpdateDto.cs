using BMIS.Domain;

namespace BMIS.Application;

public record ResidentUpdateDto (
    string? firstName,
    string? middleName,
    string? lastName,
    string? suffix,

    DateOnly? birthDate,
    string? birthPlace, 
    Sex? sex,
    string? citizenship,

    bool? isSenior,
    bool? isPwd,
    CivilStatus? civilStatus,
    string? religion,

    string? address,
    string? phone,
    string? email,

    bool? isHead,
    int? houseHoldId
);
