namespace BMIS.Models.Entities;

public class ActivityLog {
    public int Id { get; set; }
    public int HandlerId { get; set; }
    public string Message { get; set; }


    public ActivityLog(int handlerId, string message) {
        this.HandlerId = handlerId;
        this.Message = message;
    }
}
