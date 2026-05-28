using BMIS.Models.Entities;
using BMIS.Models.DTOs;
using BMIS.Interfaces;
using BMIS.Application;
using BMIS.Infrastructure;

namespace BMIS.Services;

public class UserService : IUserService {

    public readonly IPasswordHasher _passwordHasher;
    public readonly IJwtTokenGenerator _tokenGenerator;
    public readonly IUserRepository _userRepo;
    public readonly IResidentRepository _residentRepo;
    public readonly IUnitOfWork _unitOfWork;

    public UserService(
            IUnitOfWork unitOfWork,
            IResidentRepository residentRepo,
            IUserRepository userRepo,
            IJwtTokenGenerator tokenGenerator,
            IPasswordHasher passwordHasher ) {
        
        _unitOfWork = unitOfWork;
        _residentRepo = residentRepo;
        _userRepo = userRepo;
        _tokenGenerator = tokenGenerator;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<string?>> LoginAsync(string username, string password) {
        var user = await _userRepo.GetByUsernameAsync(username);
        if(user == null) {
            return ResultStatus.Conflict;
        }

        bool verify = _passwordHasher.Verify(password, user.Password);
        if(!verify) {
            return ResultStatus.Conflict;
        }

        var token = _tokenGenerator.GenerateToken(user);
        return token;
    }

    public async Task<Result<Guid>> RegisterAsync(Guid residentId, string username, string password) {
        var resident = await _residentRepo.GetByIdAsync(residentId);
        if(resident == null) {
            return ResultStatus.NotFound;
        }

        // TODO:
        //  check if a resident already has an account
        //
        // bool hasDuplicate = await _userRepo.HasDuplicateAsync(residentId) 
        //

        bool hasDuplicate = await _userRepo.HasDuplicateAsync(username);

        if(hasDuplicate){
            return ResultStatus.Conflict; 
        }

        string hashedPassword = _passwordHasher.Hash(password);
        
        User user = new User(residentId, username, hashedPassword);
        return residentId;
    }
}
