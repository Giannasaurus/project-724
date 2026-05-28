namespace BMIS.Models.DTOs;

public record TransactionCreateDto(
    Guid requesterId,
    Guid handlerId,
    DocumentType documentType,
    DateTime dateIssued
);
