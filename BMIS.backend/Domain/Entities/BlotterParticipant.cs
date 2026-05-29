namespace BMIS.Domain.Entities;

public class BlotterParticipant {
    public Guid ResidentId { get; private set; }
    
    public Guid BlotterId { get; private set; }
    public Blotter Blotter { get; private set; }

    public BlotterParticipantRole Role { get; private set; }


    public BlotterParticipant(Guid residentId, BlotterParticipantRole role, Guid blotterId) {
        this.ResidentId = residentId;
        this.Role = role;
        this.BlotterId = blotterId;
    }

    public BlotterParticipant(Guid residentId, BlotterParticipantRole role, Blotter blotter) {
        this.ResidentId = residentId;
        this.Role = role;
        this.Blotter = blotter;
    }
}
