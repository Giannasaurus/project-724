namespace BMIS.Domain.Entities;

public class HouseHold {
    public int Id { get; set; }
    public Guid HeadId { get; set; }
    
    public HouseHold() { }

    public HouseHold(int id) {
        this.Id = id;
    }
    
    public HouseHold(Guid headId) {
        this.HeadId = headId;
    }
}
