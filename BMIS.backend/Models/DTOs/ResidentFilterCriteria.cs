using Microsoft.AspNetCore.Mvc;
namespace BMIS.Models.DTOs;

public record ResidentFilterCriteria( 
    [FromQuery(Name="sex")]string[] sex,
    [FromQuery(Name="sector")]string[] sector,
    [FromQuery(Name="civilStat")]string[] civilStat,
    
    ResidentOrder? order,
    
    int? from,
    int? limit,
    
    int minAge = 0,
    int maxAge = 999
);
