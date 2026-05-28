namespace BMIS.Infrastructure.Criterias;

public record TransactionFilterCriteria(
    DateTime? from,
    DateTime? to,

    int index = 0,
    int limit = 50,

    string[]? type = null
);
