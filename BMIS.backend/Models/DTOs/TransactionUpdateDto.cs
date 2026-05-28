namespace BMIS.Models.DTOs;

public record TransactionUpdateDto(
    Guid? requesterId,
    Guid? handlerId,
    DocumentType? documentType,
    DateTime? dateIssued
);
