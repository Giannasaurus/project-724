namespace BMIS.Models.DTOs;

public record TransactionFilterCriteria(
    string[]? type,
    string[]? status,
    
    int from = 0,
    int limit = 50
);
