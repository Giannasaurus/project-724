namespace BMIS.Domain.Entities;

public class Senior {
    public Guid ResidentId { get; private set; }

    // NOTE: 
    //  reffering to the ID no.
    public string SeniorId { get; private set; }

    public Resident ResidentInfo { get; private set; } = null;
}
