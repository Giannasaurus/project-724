using System.Text.Json.Serialization;

namespace BMIS.Domain.Entities;

public class Transaction {
    public Guid Id { get; private set; }
    public Guid RequesterId { get; private set; }
    public Guid HandlerId { get; private set; }
    public DocumentType DocumentType { get; private set; }
    public DateTime DateIssued { get; private set; }
    
    [JsonIgnore]
    public Resident RequesterInfo { get; private set; } = null;
    [JsonIgnore]
    public Resident HandlerInfo { get; private set; } = null;

    public Transaction(DocumentType documentType, Guid requesterId, Guid handlerId) {
        this.DocumentType = documentType;
        this.RequesterId = requesterId;
        this.HandlerId = handlerId;
        this.DateIssued = DateTime.Now;
    }

    public Transaction(DocumentType documentType, Guid requesterId, Guid handlerId, DateTime dateIssued) {
        this.DocumentType = documentType;
        this.RequesterId = requesterId;
        this.HandlerId = handlerId;
        this.DateIssued = dateIssued;
    }
    
    public void Update(DocumentType? documentType, Guid? requesterId, Guid? handlerId, DateTime? dateIssued) {
        if(documentType != null) {
            this.DocumentType = (DocumentType)documentType;
        }

        if(requesterId != null) {
            this.RequesterId = (Guid)requesterId;
        }

        if(handlerId != null) {
            this.HandlerId = (Guid)handlerId;
        }

        if(dateIssued != null) {
            this.DateIssued = (DateTime)dateIssued;
        }
    }
}
