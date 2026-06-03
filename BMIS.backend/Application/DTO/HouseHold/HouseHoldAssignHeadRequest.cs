namespace BMIS.Application;

public record HouseHoldAssignHeadRequest(
    int houseHoldId,
    Guid headId
);
