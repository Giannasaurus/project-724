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

    int index = 0,
    int limit = 50
);
