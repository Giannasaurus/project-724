using BMIS.Models;
using BMIS.Services;

namespace BMIS.Endpoints;

public static class DocumentEndpoints {
    public static void MapDocumentEndpoints(this WebApplication app) {
        var group = app.MapGroup("/docs");

        group.MapGet("/{type}", GetTemplate);
        group.MapGet("/{type}/{id}", GetFilled);
    }

    private static async Task<IResult> GetTemplate(DocumentType type, IDocumentService documentService) {
        var results = await documentService.GetTemplate(type);
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound(); 
        }

        return TypedResults.Content(results.value, "text/html", System.Text.Encoding.UTF8);
    }

    private static async Task<IResult> GetFilled(int id, DocumentType type, IDocumentService documentService) {
        var results = await documentService.GetFilled(id, type);
        if(results.code == ResultStatus.NotFound) {
            return TypedResults.NotFound(); 
        }

        return TypedResults.Content(results.value, "text/html", System.Text.Encoding.UTF8);
    }
}

