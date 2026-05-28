namespace BMIS.Models.Entities;

public class User {
    public Guid ResidentId { get; private set; }
    public string Username { get; private set; }
    public string Password { get; private set; }
    public bool IsActive { get; private set; }


    public Resident ResidentInfo { get; private set; } = null;

    public User(Guid residentId, string username, string password) {
        this.ResidentId = residentId;
        this.Username = username;
        this.Password = password;
        this.IsActive = true;
    }
}
