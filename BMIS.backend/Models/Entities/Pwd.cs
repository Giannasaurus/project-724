namespace BMIS.Models.Entities;

public class Pwd {
    public required Guid ResidentId { get; set; }

    // NOTE: 
    //  reffering to the image path of the ID
    public required string PwdId{ get; set; }

    public Resident ResidentInfo { get; set; }
}
