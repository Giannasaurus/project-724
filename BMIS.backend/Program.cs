using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using BMIS;
using BMIS.Endpoints;
using BMIS.Application.Interfaces;
using BMIS.Application.Services;
using BMIS.Infrastructure;


var ELECTRON_CORS = "electronCors";


var builder = WebApplication.CreateBuilder(args);

if(builder.Environment.IsDevelopment()) {
    Console.WriteLine("[!] running in development");    

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT"
        });

        options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
    });
}


//
// URGENT: 
//  key hardcoded in appsettings.json and is not safe
//
var jwtIssuer = builder.Configuration.GetSection("Jwt:Issuer").Get<string>();
var jwtAudience = builder.Configuration.GetSection("Jwt:Audience").Get<string>();
var jwtKey = builder.Configuration.GetSection("Jwt:Key").Get<string>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = false,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();


builder.Services.AddScoped<IResidentService, ResidentService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IBlotterService, BlotterService>();
builder.Services.AddScoped<IOfficialService, OfficialService>();
builder.Services.AddScoped<IHouseHoldService, HouseHoldService>();

builder.Services.AddScoped<IResidentRepository, ResidentRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IBlotterRepository, BlotterRepository>();
builder.Services.AddScoped<IBlotterParticipantRepository, BlotterParticipantRepository>();
builder.Services.AddScoped<IOfficialRepository, OfficialRepository>();
builder.Services.AddScoped<IHouseHoldRepository, HouseHoldRepository>();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();


//
// [!] WARNING
// 
// Generally UNSAFE to use "AllowAny*" options especially AllowAnyOrigin()
// Specific origins should be used
// In this case it should be electron frontend origin
//
// But bacause the project is local, I believe it is okay
// No other client would try to access the backend
//
builder.Services.AddCors(options => {
        options.AddPolicy(ELECTRON_CORS, policy => {
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod();
        });
    });


//
// URGENT: 
//  key hardcoded in appsettings.json and is not safe
//
var dbName = builder.Configuration["DbSettings:Name"];
var dbkey = builder.Configuration["DbSettings:Key"];
var dbPath = Path.Join(AppContext.BaseDirectory, "LocalDatabase.db");
builder.Services.AddDbContext<AppDbContext>(options => { 
        options.UseSqlite($"Data Source={dbPath};Password={dbkey}");
    });



var app = builder.Build();

app.UseCors(ELECTRON_CORS);

if(app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseAuthentication();
app.UseAuthorization();

using(var scope = app.Services.CreateScope()) {
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try {   
        var context = services.GetRequiredService<AppDbContext>();
        
        logger.LogInformation("Checking database updates...");
        
        await context.Database.MigrateAsync();
        
        logger.LogInformation("Database up to date...");
    } catch(Exception ex) {
        logger.LogCritical(ex, "Error during database updates... "); 

        throw;
    }
}

if(app.Environment.IsDevelopment() || args.Contains("dev")) {
    app.MapGet("/health", (AppDbContext db) => { return TypedResults.Ok("active"); }).AllowAnonymous();
    app.MapGet("/", (AppDbContext db) => { return TypedResults.Ok("active"); }).AllowAnonymous();
    app.MapResidentEndpoints().AllowAnonymous();
    app.MapTransactionEndpoints().AllowAnonymous();
    app.MapDocumentEndpoints().AllowAnonymous();
    app.MapUserEndpoints().AllowAnonymous();
    app.MapBlotterEndpoints().AllowAnonymous();
    app.MapOfficialEndpoints().AllowAnonymous();
    app.MapHouseHoldEndpoints().AllowAnonymous();
} else {
    app.MapGet("/health", (AppDbContext db) => { return TypedResults.Ok("active"); }).AllowAnonymous();
    app.MapGet("/", (AppDbContext db) => { return TypedResults.Ok("active"); }).AllowAnonymous();
    app.MapResidentEndpoints().RequireAuthorization();
    app.MapTransactionEndpoints().RequireAuthorization();
    app.MapDocumentEndpoints().RequireAuthorization();
    app.MapUserEndpoints().AllowAnonymous();
    app.MapBlotterEndpoints().RequireAuthorization();
    app.MapOfficialEndpoints().RequireAuthorization();
    app.MapHouseHoldEndpoints().RequireAuthorization();
}

app.Run();

