using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddSqlite<AppDbContext>(connectionString);

var app = builder.Build();

if(app.Environment.IsDevelopment()) {
    var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    context.Database.EnsureCreated();
    DbInitializer.Initialize(context);
}

app.MapGet("/all", async (AppDbContext db) => {
    return await db.Residents.AsNoTracking().ToListAsync();
});

app.Run();
