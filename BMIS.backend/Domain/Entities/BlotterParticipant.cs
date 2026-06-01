using System.Text.Json.Serialization;

namespace BMIS.Domain.Entities;

public class BlotterParticipant {
    public Guid ResidentId { get; private set; }
    public Guid BlotterId { get; private set; }
    public BlotterParticipantRole Role { get; private set; }

    [JsonIgnore]
    public Blotter BlotterInfo { get; private set; }
    
    [JsonIgnore]
    public Resident ResidentInfo { get; private set; }


    public BlotterParticipant(Guid residentId, BlotterParticipantRole role, Guid blotterId) {
        this.ResidentId = residentId;
        this.Role = role;
        this.BlotterId = blotterId;
    }

    public BlotterParticipant(Guid residentId, BlotterParticipantRole role, Blotter blotterInfo) {
        this.ResidentId = residentId;
        this.Role = role;
        this.BlotterInfo = blotterInfo;
    }
}
