namespace BMIS.Models.DTOs;

public record TransactionFilterCriteria(
    string[]? type,
    string[]? status,

    /*
     * TODO:
     * NOT IMPLEMENTED IN ACTUAL ENDPOINT
     *
     */
    string[]? requesters,
    string[]? handlers,

    DateTime? from,
    DateTime? to,

    TransactionOrder order = TransactionOrder.ByRecent, 

    int index = 0,
    int limit = 50
);
