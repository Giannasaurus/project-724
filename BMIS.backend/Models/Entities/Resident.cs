using System.ComponentModel.DataAnnotations;

namespace BMIS.Models.Entities;

public class Resident {
    [Key]
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string MiddleName { get; set; }
    public string LastName { get; set; }
    public string Suffix { get; set; }
    public DateOnly BirthDate { get; set; }
    public int Age { get; set; }
    public Sector Sector { get; set; }
    public Gender Gender { get; set; }
    public CivilStatus CivilStatus { get; set; }
    public string Address { get; set; }
}
