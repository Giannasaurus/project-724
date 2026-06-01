namespace BMIS.Domain.Entities;

public class Deceased {
    public Guid ResidentId { get; set; }
    public DateTime DateOfDeath { get; set; }

    // NOTE:
    //  reffering to the image path
    public string DeathCertificate { get; set; }

    public Resident ResidentInfo { get; set; }
}
