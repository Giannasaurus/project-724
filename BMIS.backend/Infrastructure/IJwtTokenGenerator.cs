
using BMIS.Models.Entities;

namespace BMIS.Application;

public interface IJwtTokenGenerator{
    string GenerateToken(User user);
}
