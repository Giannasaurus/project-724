using System.ComponentModel.DataAnnotations;

namespace BMIS.Models.Entities;

public class Deceased {
    [Key]
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public DateTime DateOfDeath { get; set; }
}
