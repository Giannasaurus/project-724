using System.ComponentModel.DataAnnotations;

namespace BMIS.Models.Entities;

public class HouseHold {
    [Key]
    public int Id { get; set; }
    public int Population { get; set; }
    public int HeadId { get; set; }
}
