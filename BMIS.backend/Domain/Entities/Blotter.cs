namespace BMIS.Domain.Entities;

public class Blotter {
    public Guid Id { get; init; }
    public DateTime DateIssued { get; private set; }
    public BlotterNature Nature { get; private set; }
    public string Details { get; private set; }
    public Guid HandlerId { get; private set; }

    public Blotter(BlotterNature nature, Guid handlerId, string details) {
        this.Nature = nature;
        this.HandlerId = handlerId;
        this.Details = details;
    }
    
    public Blotter(BlotterNature nature, Guid handlerId, string details, DateTime dateIssued) {
        this.Nature = nature;
        this.HandlerId = handlerId;
        this.Details = details;
        this.DateIssued = dateIssued;
    }

    public void UpdateDetails(string details) {
        if(!string.IsNullOrEmpty(details)) {
            this.Details = details;
        }
    }
}
