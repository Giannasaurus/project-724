using BMIS.Models;    

namespace BMIS.Services;

public interface IDocumentService {
    Task<Result<string>> GetDocument(DocumentType type);
}
