using BMIS.Models;    

namespace BMIS.Services;

public interface IDocumentService {
    Task<Result<string>> GetTemplate(DocumentType type);
        
    Task<Result<string>> GetFilled(int residentId, DocumentType type);
}
