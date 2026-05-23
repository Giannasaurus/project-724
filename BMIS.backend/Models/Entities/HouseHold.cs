namespace BMIS.Models.Entities;

public class HouseHold {
    public int Id { get; set; }
    public required Guid HeadId { get; set; }

    public Resident HeadInfo { get; set; }
    public ICollection<Resident> Members { get; set; }
}
