using Microsoft.AspNetCore.Mvc;

namespace BMIS.Application;

public record ResidentFilterCriteria( 

    bool? isSenior,
    bool? isPwd,

    
    int? from,
    int? limit,

    bool? isHead,
    
    int? minAge,
    int? maxAge,

    [FromQuery(Name="sex")]string[]? sex = null,
    [FromQuery(Name="civilStat")]string[]? civilStatus = null
);
