namespace BMIS.Domain.Entities;

public class Pwd {
    public Guid ResidentId { get; set; }

    // NOTE: 
    //  reffering to the image path of the ID
    public string PwdId{ get; set; }

    public Resident ResidentInfo { get; set; }
}
