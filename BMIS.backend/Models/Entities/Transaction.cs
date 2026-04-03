using System.ComponentModel.DataAnnotations;

namespace BMIS.Models.Entities;

public class Transaction {
    [Key]
    public int Id { get; set; }
    public int RequesterId { get; set; }
    public int HandlerId { get; set; }
    public DocumentType TypeOfDocument { get; set; }
    public TransactionStatus Status { get; set; } 
    public DateTime Date { get; set; }
}
