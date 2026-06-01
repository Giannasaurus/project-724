using Microsoft.AspNetCore.Mvc;
using BMIS.Domain;

namespace BMIS.Application;

public record OfficialFilterCriteria(
    [FromQuery(Name="role")]string[]? roles = null
);
