using Microsoft.AspNetCore.Mvc;
using BMIS.Domain;

namespace BMIS.Application;

public record OfficialFilterCriteria(
    [FromQuery(Name="status")]string[]? status = null,
    [FromQuery(Name="role")]string[]? roles = null
);
