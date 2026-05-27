using Microsoft.AspNetCore.Mvc;
namespace BMIS.Models.DTOs;

public record ResidentFilterCriteria( 
    [FromQuery(Name="sex")]string[] sex,


    // 
    //  TODO: 
    //      implement filtering in the resident service
    //
    [FromQuery(Name="sector")]string[] sector,


    [FromQuery(Name="civilStat")]string[] civilStat,
    
    ResidentOrder? order,
    
    int? from,
    int? limit,

    bool? isHead,
    
    int minAge = 0,
    int maxAge = 999
);
