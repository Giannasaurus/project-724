using BMIS.Models;
using BMIS;

namespace BMIS.Services;

public class DocumentService : IDocumentService {
    public static Dictionary<DocumentType, string> documentLocations; 

    public readonly AppDbContext _db;
    
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

    public DocumentService(AppDbContext db) {
        _db = db;
    }

    public async Task<Result<string>> GetTemplate(DocumentType type) { 
        if(!documentLocations.ContainsKey(type)) {
            return ResultStatus.NotFound;
        }

        string path = documentLocations[type];
        string content = await File.ReadAllTextAsync(path);

        return content; 
    }

    public async Task<Result<string>> GetFilled(int residentId, DocumentType type) {
        var resident = await _db.Residents.FindAsync(residentId);

        if(resident == null){
            return ResultStatus.NotFound;
        }
        
        if(!documentLocations.ContainsKey(type)) {
            return ResultStatus.NotFound;
        }

        string path = documentLocations[type];
        string content = await File.ReadAllTextAsync(path);

        DateTime current = DateTime.Now;
        
        string edited = content.Replace("{{fullName}}", $"{resident.ToString()}".Trim())
                           .Replace("{{birthDate}}", resident.BirthDate.ToString("MMM dd, yyyy"))
                           .Replace("{{civilStatus}}", resident.CivilStatus.ToString())
                           .Replace("{{address}}", resident.Address)
                           .Replace("{{pronoun}}", resident.Sex == Sex.Male ? "he" : "she")
                           .Replace("{{pronoun2}}", resident.Sex == Sex.Male ? "his" : "she")
                           .Replace("{{signDay}}", Utils.RankNum(current.Day))
                           .Replace("{{signMonth}}", current.ToString("MMM"))
                           .Replace("{{signYear}}", current.ToString("yyyy"))
                           .Replace("{{chairName}}", "Rolando V. Navarro".ToUpper());

        return edited; 
    }
}
