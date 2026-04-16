using Microsoft.EntityFrameworkCore;
using BMIS.Models;
using BMIS.Models.Entities;
using BMIS.Models.DTOs;

namespace BMIS.Endpoints;

public static class DocumentEndpoints {
    public static void MapDocumentEndpoints(this WebApplication app) {
        var group = app.MapGroup("/docs");
        group.MapGet("/{type}/{id}", GetDocument);
    }

    private static async Task<IResult> GetDocument(int type, int id, AppDbContext db) {
        var data = await db.Residents.FindAsync(id);
    
        if(data == null) {
            return TypedResults.NotFound("Resident not found");
        }
        
        string template;

        try {
            string? docName = Enum.GetName(typeof(DocumentType), type);
            template = File.ReadAllText(Path.Join(AppContext.BaseDirectory, "Resources", "Templates", $"{docName}.html"));
        } catch(FileNotFoundException fnfe) {
            Console.WriteLine($"ERROR: {fnfe.Message}");
            return TypedResults.NotFound("Document type not found");
        }
        
        string fullName = $"{data.LastName}, {data.FirstName}, {data.MiddleName} {data.Suffix}";
        template = template.Replace("{{fullName}}", fullName.Trim());

        return TypedResults.Content(template, "text/html", System.Text.Encoding.UTF8);
    }
}

