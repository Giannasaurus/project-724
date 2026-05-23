namespace BMIS.Models.Entities;

public class User {
    public Guid Id { get; set; }
    public required string UserName { get; }
    public required string Password { get; }
    public required bool IsActive { get; set; } 
}
