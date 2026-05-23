namespace BMIS.Models.DTOs;

public record TransactionUpdateDto(
    Guid? requesterId,
    Guid? handlerId,
    DocumentType? documentType,
    TransactionStatus? status,
    DateTime? date
);
