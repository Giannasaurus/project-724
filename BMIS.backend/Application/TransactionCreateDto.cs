using BMIS.Domain;

namespace BMIS.Application;

public record TransactionCreateDto(
    Guid requesterId,
    Guid handlerId,
    DocumentType documentType,
    DateTime dateIssued
);
