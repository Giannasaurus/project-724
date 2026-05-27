using BMIS.Models.DTOs;

namespace BMIS.Models.Entities;

public class Transaction {
    public Guid Id { get; set; }
    public required Guid RequesterId { get; set; }
    public required Guid HandlerId { get; set; }
    public required DocumentType DocumentType { get; set; }
    public required TransactionStatus Status { get; set; } 
    public required DateTime Date { get; set; }

    public Resident RequesterInfo { get; set; }
    public User HandlerInfo { get; set; }
}
