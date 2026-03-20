using Microsoft.EntityFrameworkCore;
using BMIS.Models.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddSqlite<AppDbContext>(connectionString);

var app = builder.Build();

if(app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();

    var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    context.Database.EnsureCreated();
    DbInitializer.Initialize(context);
}



// GET all 
app.MapGet("/residents", async (AppDbContext db) => {
    return await db.Residents.AsNoTracking().ToListAsync();
});



// GET from index to limit
app.MapGet("/residents/from", async (int? index, int? limit, AppDbContext db) => {
    int pageIndex = index ?? 0;
    int pageLimit = limit ?? 50;

    return await db.Residents
        .AsNoTracking()
        .Skip(pageIndex)
        .Take(pageLimit)
        .ToListAsync();
});



// GET resident w/ {id}
app.MapGet("/residents/{id}", async (int id, AppDbContext db) => {
    var resident = await db.Residents.FindAsync(id);

    if(resident is null) return Results.NotFound();

    return Results.Ok(resident);
});



// CREATE resident
app.MapPost("/residents", async (Resident resident, AppDbContext db) => {
    db.Residents.Add(resident);
    await db.SaveChangesAsync();

    return Results.Created($"/residents/{resident.Id}", resident);
});


// REMOVE resident
app.MapDelete("/residents/{id}", async (int id, AppDbContext db) => {
    var resident = await db.Residents.FindAsync(id);

    if(resident is null) {
        return Results.NotFound();
    }

    db.Residents.Remove(resident);
    await db.SaveChangesAsync();

    return Results.NoContent();
});


// UPDATE resident
app.MapPut("/residents/{id}", async (int id, Resident changes, AppDbContext db) => {
    var resident = await db.Residents.FindAsync(id);

    if(resident is null) return Results.NotFound();

    resident.FirstName = changes.FirstName;
    resident.MiddleName = changes.MiddleName;
    resident.LastName = changes.LastName;
    resident.BirthDate = changes.BirthDate;
    resident.IsPwdOrSenior = changes.IsPwdOrSenior;
    resident.Gender = changes.Gender;
    resident.CivilStatus = changes.CivilStatus;
    resident.Address = changes.Address;

    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();
