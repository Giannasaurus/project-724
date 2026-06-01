using Microsoft.AspNetCore.Mvc;
using BMIS.Domain;

namespace BMIS.Application;

public record BlotterParticipantFilterCriteria(
    [FromQuery(Name="role")]string[]? roles = null    
);
