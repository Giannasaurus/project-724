namespace BMIS.Models.DTOs;

public record TransactionCreateDto(
    int requesterId,
    int handlerId,
    DocumentType documentType,
    TransactionStatus status,
    DateTime date
);
