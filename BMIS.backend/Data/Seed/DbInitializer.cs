using Bogus;
using BMIS.Models;
using BMIS.Models.Entities;

public static class DbInitializer {
    public static void Initialize(AppDbContext context) { 
        if(context.Residents.Any()) return;
        
        int resId = 1;
        var faker = new Faker<Resident>()
            .RuleFor(r => r.Id, f => resId++) 
            .RuleFor(r => r.FirstName, f => f.Name.FirstName())
            .RuleFor(r => r.MiddleName, f => f.Name.LastName())
            .RuleFor(r => r.LastName, f => f.Name.LastName())
            .RuleFor(r => r.Suffix, f => f.Name.Suffix())
            .RuleFor(r => r.BirthDate, f => f.Date.PastDateOnly(80))
            .RuleFor(r => r.Sector, f => f.PickRandom<Sector>())
            .RuleFor(r => r.Gender, f => f.PickRandom<Gender>())
            .RuleFor(r => r.CivilStatus, f => f.PickRandom<CivilStatus>())
            .RuleFor(r => r.Address, f => $"BLOCK {f.Random.Number(1, 9)}");

        var residents = faker.Generate(2000);

        context.Residents.AddRange(residents);
        context.SaveChanges();
    }
}
