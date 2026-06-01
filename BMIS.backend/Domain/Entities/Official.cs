namespace BMIS.Domain.Entities;

public class Official {
    public Guid ResidentId { get; private set; }
    public OfficialRole Role { get; private set; }
    public Resident ResidentInfo { get; private set; } 

    public Official(Guid residentId, OfficialRole role) {
        this.ResidentId = residentId; 
        this.Role = role;
    }

    public void UpdateRole(OfficialRole role) {
        this.Role = role;
    }
}
