using BMIS.Domain;

namespace BMIS.Application;

public record TransactionUpdateDto(
    Guid? requesterId,
    Guid? handlerId,
    DocumentType? documentType,
    DateTime? dateIssued
);
