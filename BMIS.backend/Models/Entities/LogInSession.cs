using System.ComponentModel.DataAnnotations;

namespace BMIS.Models.Entites;

public class LogInSession {
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime TimeIn { get; set; }
    public DateTime TimeOut { get; set; }
}
