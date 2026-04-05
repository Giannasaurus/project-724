using BMIS.Endpoints;

var ELECTRON_CORS = "electronCors";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddSqlite<AppDbContext>(connectionString);

var app = builder.Build();

if(app.Environment.IsDevelopment() || args.Contains("dev")) {
    Console.WriteLine("[!] BACKEND: running in dev mode"); 
    app.UseSwagger();
    app.UseSwaggerUI();

    var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    if(!Directory.Exists("Sample")) {
        Directory.CreateDirectory("Sample");
    }

    context.Database.EnsureCreated();
    DbInitializer.Initialize(context);
}

app.UseCors(ELECTRON_CORS);

app.MapGet("/", (AppDbContext db) => { return TypedResults.Ok("active"); });
app.MapResidentEndpoints();
app.MapTransactionEndpoints();

app.Run();
