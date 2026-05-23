namespace BMIS.Models.Entities;

public class User {
    public Guid Id { get; set; }
    public required string UserName { get; set; }
    public required string Password { get; set; }
    public required bool IsActive { get; set; } 
}
