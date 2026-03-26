namespace BMIS.Models.DTOs;

public record ResidentFilterCriteria( 
    string? firstName,
    string? middleName,
    string? lastName,
    int? minAge,
    int? maxAge,

    string[]? sex,
    string[]? sector,
    string[]? civilStat,

    int page = 1,
    int pageSize = 50
);
