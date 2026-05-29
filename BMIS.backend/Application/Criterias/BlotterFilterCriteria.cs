using Microsoft.AspNetCore.Mvc;

namespace BMIS.Application;

public record BlotterFilterCriteria(
    DateTime? from,
    DateTime? to,
    [FromQuery(Name="nature")]string[]? natures = null 
);
