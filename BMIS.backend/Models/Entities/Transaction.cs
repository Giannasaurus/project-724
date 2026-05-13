using System.ComponentModel.DataAnnotations;
using BMIS.Models.DTOs;

namespace BMIS.Models.Entities;

public class Transaction {
    [Key]
    public int Id { get; set; }
    public int RequesterId { get; set; }
    public int HandlerId { get; set; }
    public DocumentType DocumentType { get; set; }
    public TransactionStatus Status { get; set; } 
    public DateTime Date { get; set; }

    public Transaction(
            int requesterId,
            int handlerId,
            DocumentType documentType,
            TransactionStatus status,
            DateTime date
        ) {

        this.RequesterId = requesterId;
        this.HandlerId = handlerId;
        this.DocumentType = documentType;
        this.Status = status;
        this.Date = date;

    }

    public Transaction(TransactionCreateDto details) {
        this.RequesterId = details.requesterId;
        this.HandlerId = details.handlerId;
        this.DocumentType = details.documentType;
        this.Status = details.status;
        this.Date = details.date;
    }
}
