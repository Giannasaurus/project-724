using BMIS.Domain;    

namespace BMIS.Application.Interfaces;

public interface IDocumentService {
    Task<Result<string>> GetTemplate(DocumentType type);
        
    Task<Result<string>> GetFilled(int residentId, DocumentType type);
}
