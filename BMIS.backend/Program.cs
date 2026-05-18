using BMIS.Endpoints;
using BMIS.Services;
using Microsoft.EntityFrameworkCore;

var ELECTRON_CORS = "electronCors";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IResidentService, ResidentService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();

/* 
 * [!] WARNING
 * 
 * Generally UNSAFE to use "AllowAny*" options especially AllowAnyOrigin()
 * Specific origins should be used
 * In this case it should be electron frontend origin
 *
 * But bacause the project is local, I believe it is okay
 * No other client would try to access the backend
 *
 */
builder.Services.AddCors(options => {
        options.AddPolicy(ELECTRON_CORS, policy => {
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod();
        });
    });

var dbPath = Path.Join(AppContext.BaseDirectory, "LocalDatabase.db");
builder.Services.AddSqlite<AppDbContext>("Data Source="+dbPath);

var app = builder.Build();

if(app.Environment.IsDevelopment() || args.Contains("dev")) {
    Console.WriteLine("[!] BACKEND: running in dev mode"); 
    app.UseSwagger();
    app.UseSwaggerUI();

    var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    context.Database.EnsureCreated();
    EnsureDatabaseSchema(context);
    DbInitializer.Initialize(context);
}

app.UseCors(ELECTRON_CORS);

app.MapGet("/health", (AppDbContext db) => { return TypedResults.Ok("active"); });
app.MapGet("/", (AppDbContext db) => { return TypedResults.Ok("active"); });
app.MapResidentEndpoints();
app.MapTransactionEndpoints();
app.MapDocumentEndpoints();

app.Run();

static void EnsureDatabaseSchema(AppDbContext context) {
    var residentColumns = GetColumnNames(context, "Residents");
    if(residentColumns.Contains("ResidentId") && !residentColumns.Contains("Id")) {
        context.Database.ExecuteSqlRaw("ALTER TABLE Residents RENAME COLUMN ResidentId TO Id");
        residentColumns = GetColumnNames(context, "Residents");
    }

    if(!residentColumns.Contains("Contact")) {
        context.Database.ExecuteSqlRaw("ALTER TABLE Residents ADD COLUMN Contact TEXT NOT NULL DEFAULT ''");
    }

    var transactionColumns = GetColumnNames(context, "Transactions");
    if(transactionColumns.Contains("TypeOfDocument") && !transactionColumns.Contains("DocumentType")) {
        context.Database.ExecuteSqlRaw("ALTER TABLE Transactions RENAME COLUMN TypeOfDocument TO DocumentType");
    }
}

static HashSet<string> GetColumnNames(AppDbContext context, string tableName) {
    var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    var connection = context.Database.GetDbConnection();
    var shouldClose = connection.State != System.Data.ConnectionState.Open;

    if(shouldClose) {
        connection.Open();
    }

    try {
        using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info(\"{tableName}\")";

        using var reader = command.ExecuteReader();
        while(reader.Read()) {
            columns.Add(reader.GetString(1));
        }
    }
    finally {
        if(shouldClose) {
            connection.Close();
        }
    }

    return columns;
}
