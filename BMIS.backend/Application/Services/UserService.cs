using BMIS.Domain.Entities;
using BMIS.Application.Interfaces;

namespace BMIS.Application.Services;

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

    public async Task<Result<string?>> LoginAsync(LogInRequest credentials) {
        var user = await _userRepo.GetByUsernameAsync(credentials.username);
        if(user == null) {
            return ResultStatus.Conflict;
        }

        bool verify = _passwordHasher.Verify(credentials.password, user.Password);
        if(!verify) {
            return ResultStatus.Conflict;
        }

        var token = _tokenGenerator.GenerateToken(user);
        return token;
    }

    public async Task<Result<Guid>> RegisterAsync(RegistrationRequest details) {
        var resident = await _residentRepo.GetByIdAsync(details.residentId);
        if(resident == null) {
            return ResultStatus.NotFound;
        }

        // TODO:
        //  check if a resident already has an account
        //
        // bool hasDuplicate = await _userRepo.HasDuplicateAsync(residentId) 
        //

        bool hasDuplicate = await _userRepo.HasDuplicateAsync(details.username);

        if(hasDuplicate){
            return ResultStatus.Conflict; 
        }

        string hashedPassword = _passwordHasher.Hash(details.password);
        
        User user = new User(details.residentId, details.username, hashedPassword);

        _userRepo.Add(user);
        await _unitOfWork.SaveChangesAsync();

        return details.residentId;
    }

    public async Task<Result<Guid>> UpdateAsync(Guid id, AccountUpdateRequest changes) {
        var user = await _userRepo.GetByIdAsync(id);
        if(user == null) {
            return ResultStatus.NotFound;
        }
        
        if(changes.residentId != null) {
            var resident = await _residentRepo.GetByIdAsync((Guid)changes.residentId);
            if(resident == null) {
                return ResultStatus.NotFound;
            }
        }

        // TODO:
        //  check if a resident already has an account
        //
        // bool hasDuplicate = await _userRepo.HasDuplicateAsync(residentId) 
        //
        
        if(!string.IsNullOrEmpty(changes.username)) {
            bool hasDuplicate = await _userRepo.HasDuplicateAsync((string)changes.username);

            if(hasDuplicate){
                return ResultStatus.Conflict; 
            }
        }

        string hashedPassword = string.Empty;

        if(!string.IsNullOrEmpty(changes.password)) {
            hashedPassword = _passwordHasher.Hash(changes.password);
        }
        
        user.Update(changes.residentId, changes.username, hashedPassword);

        await _unitOfWork.SaveChangesAsync();        

        return id;
    }
}
