namespace BMIS.Domain.Entities;

public class User {
    public Guid ResidentId { get; private set; }
    public string Username { get; private set; }
    public string Password { get; private set; }
    public bool IsActive { get; private set; }

    public Official OfficialInfo { get; private set; }

    public User(Guid residentId, string username, string password) {
        this.ResidentId = residentId;
        this.Username = username;
        this.Password = password;
        this.IsActive = true;
    }
    
    public void Update(string? username, string? password) {
        if(!string.IsNullOrEmpty(username)) {
            this.Username = (string)username;
        }

        if(!string.IsNullOrEmpty(password)) {
            this.Password = (string)password;
        }
    }
    
    public void Activate() {
        this.IsActive = true;
    }

    public void Deactivate() {
        this.IsActive = false;
    }
    
    public string GetRecoveryCode { 
        get {
            var residentInfo = OfficialInfo.ResidentInfo;
            return $"{residentInfo.LastName.ToUpper()}{residentInfo.BirthDate.ToString("yyyy-MM-dd")}";   
        }
    }
}
