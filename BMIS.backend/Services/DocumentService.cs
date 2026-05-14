using BMIS.Models;
using BMIS;

namespace BMIS.Services;

public class DocumentService : IDocumentService {
    public static Dictionary<DocumentType, string> documentLocations; 
    
    static DocumentService(){
        documentLocations = new();
        
        documentLocations.Add(
                DocumentType.BrgyClearance,
                Path.Join(AppContext.BaseDirectory, "Resources", "Templates", "BrgyClearance.html")
            );
        
        documentLocations.Add(
                DocumentType.CertOfResidency,
                Path.Join(AppContext.BaseDirectory, "Resources", "Templates", "CertOfResidency.html")
            );

        documentLocations.Add(
                DocumentType.CertOfIndigency,
                Path.Join(AppContext.BaseDirectory, "Resources", "Templates", "CertOfIndigency.html")
            );
    }

    public async Task<Result<string>> GetDocument(DocumentType type) { 
        if(!documentLocations.ContainsKey(type)) {
            return ResultStatus.NotFound;
        }

        string path = documentLocations[type];
        string content = await File.ReadAllTextAsync(path);

        return content; 
    }
}
