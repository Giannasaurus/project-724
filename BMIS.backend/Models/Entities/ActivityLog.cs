namespace BMIS.Models.Entities;

public class ActivityLog {
    public int Id { get; set; }
    public Guid HandlerId { get; set; }
    public string? Message { get; set; }
}
