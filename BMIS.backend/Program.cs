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

Console.WriteLine("[~] backend: starting ... ");


var ELECTRON_CORS = "electronCors";


var builder = WebApplication.CreateBuilder(args);

if(!builder.Environment.IsDevelopment()) {
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

    builder.Services.AddAuthorization(options => {
         options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
    });
}

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

builder.Services.AddScoped<IResidentService, ResidentService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IBlotterService, BlotterService>();

builder.Services.AddScoped<IResidentRepository, ResidentRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IBlotterRepository, BlotterRepository>();
builder.Services.AddScoped<IBlotterParticipantRepository, BlotterParticipantRepository>();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();


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
    Console.WriteLine("[!] backend: running in dev mode"); 
    app.UseSwagger();
    app.UseSwaggerUI();

    var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();

    context.Database.EnsureCreated();
    DbInitializer.Initialize(context);
} else {
    app.UseAuthentication();
    app.UseAuthorization();
}

app.UseCors(ELECTRON_CORS);

app.MapGet("/health", (AppDbContext db) => { return TypedResults.Ok("active"); });
app.MapGet("/", (AppDbContext db) => { return TypedResults.Ok("active"); });
app.MapResidentEndpoints();
app.MapTransactionEndpoints();
app.MapDocumentEndpoints();
app.MapUserEndpoints();
app.MapBlotterEndpoints();

app.Run();

