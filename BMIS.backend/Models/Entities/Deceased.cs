namespace BMIS.Models.Entities;

public class Deceased {
    public required Guid ResidentId { get; set; }
    public required DateTime DateOfDeath { get; set; }

    // NOTE:
    //  reffering to the image path
    public required string DeathCertificate { get; set; }

    public Resident ResidentInfo { get; set; }
}
