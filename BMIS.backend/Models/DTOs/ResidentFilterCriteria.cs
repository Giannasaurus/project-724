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

    ResidentOrder order = ResidentOrder.ByLastName,
    
    int from = 1,
    int limit = 50
);
