using BMIS.Models.DTOs;

namespace BMIS.Models.Entities;

public class Resident {
    public Guid Id { get; set; }

    public required string FirstName { get; set; }
    public string? MiddleName { get; set; }
    public required string LastName { get; set; }
    public string? Suffix { get; set; }
    
    public required DateOnly BirthDate { get; set; }
    public required Sex Sex { get; set; }
    public required CivilStatus CivilStatus { get; set; }
    
    public required string Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    
    public required bool IsHead { get; set; }
    public required int HouseHoldId { get; set; }
}
