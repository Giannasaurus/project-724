namespace BMIS.Models.DTOs;

public record ResidentFilterCriteria( 
    string? firstName,
    string? middleName,
    string? lastName,
    int? minAge,
    int? maxAge,

    IEnumerable<string>? sex,
    IEnumerable<string>? sector,
    IEnumerable<string>? civilStat,
    
    ResidentOrder? order,
    
    int? from,
    int? limit
);
