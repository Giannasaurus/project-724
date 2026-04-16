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
        
        /*
         * NOTE: the following placeholders need to be replaced on the template before returning to api requester
         *
         * fullName     <= name format that would appear on certificate
         * birthDate    <= birthdate of resident
         * civilStatus  <= civil status of resident
         * address      <= where does the resident reside within the barangay
         * pronoun      <= based on sex (he/she)
         * pronoun2     <= based on sex but possesive (his/her)
         * signDay      <= should be current day
         * signMonth    <= should be current month
         * signYear     <= should be current year
         * chairName    <= who is the current chairman
         *
         *
        */

        try {
            string? docName = Enum.GetName(typeof(DocumentType), type);
            template = File.ReadAllText(Path.Join(AppContext.BaseDirectory, "Resources", "Templates", $"{docName}.html"));
        } catch(FileNotFoundException fnfe) {
            Console.WriteLine($"ERROR: {fnfe.Message}");
            return TypedResults.NotFound("Document type not found");
        }
       
        DateOnly current = DateOnly.FromDateTime(DateTime.Now);

        template = template.Replace("{{fullName}}", $"{data.LastName}, {data.FirstName}, {data.MiddleName} {data.Suffix}".Trim())
                           .Replace("{{birthDate}}", data.BirthDate.ToString("MMM dd, yyyy"))
                           .Replace("{{civilStatus}}", data.CivilStatus.ToString())
                           .Replace("{{address}}", data.Address)
                           .Replace("{{pronoun}}", data.Sex == Sex.Male ? "he" : "she")
                           .Replace("{{pronoun2}}", data.Sex == Sex.Male ? "his" : "she")
                           .Replace("{{signDay}}", Utils.RankNum(current.Day))
                           .Replace("{{signMonth}}", current.ToString("MMM"))
                           .Replace("{{signYear}}", current.ToString("yyyy"))
                           .Replace("{{chairName}}", "Rolando V. Navarro".ToUpper());

        return TypedResults.Content(template, "text/html", System.Text.Encoding.UTF8);
    }
}

