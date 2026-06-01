namespace BMIS.Domain.Entities;

public class Official {
    public Guid ResidentId { get; private set; }
    public OfficialRole Role { get; private set; }
    public bool IsActive { get; private set; }

    public DateOnly AssignDate { get; private set; }
    public DateOnly? EndDate { get; private set; }

    public Resident ResidentInfo { get; private set; } 

    private Official() { }

    public Official(
            Guid residentId,
            OfficialRole role,
            bool isActive,
            DateOnly assignDate) {

        this.ResidentId = residentId; 
        this.Role = role;
        this.IsActive = true;
        this.AssignDate = assignDate;
        this.EndDate = null;
    }

    public void UpdateRole(OfficialRole role) {
        this.Role = role;
    }

    public void Activate() {
        this.IsActive = true;
        this.AssignDate = DateOnly.FromDateTime(DateTime.Now);
    }

    public void Deactivate() {
        if(this.IsActive) {
            this.EndDate = DateOnly.FromDateTime(DateTime.Now);
            this.IsActive = false;
        }
    }
}
