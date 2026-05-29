namespace BMIS.Domain.Entities;

public class Senior {
    public Guid ResidentId { get; set; }

    // NOTE: 
    //  reffering to the image path of the ID
    public string SeniorId { get; set; }

    public Resident ResidentInfo { get; set; }
}
