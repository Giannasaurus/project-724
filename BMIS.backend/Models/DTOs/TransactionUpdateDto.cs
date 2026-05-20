namespace BMIS.Models.DTOs;

public record TransactionUpdateDto(
    int? requesterId,
    int? handlerId,
    DocumentType? documentType,
    TransactionStatus? status,
    DateTime? date
);
