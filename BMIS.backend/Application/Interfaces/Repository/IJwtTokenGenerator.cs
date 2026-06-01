using BMIS.Domain.Entities;

namespace BMIS.Application.Interfaces;

public interface IJwtTokenGenerator{
    string GenerateToken(User user);
}
