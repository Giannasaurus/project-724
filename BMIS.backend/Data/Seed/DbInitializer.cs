using Bogus;
using BMIS.Models;
using BMIS.Models.Entities;

public static class DbInitializer {
    public static void Initialize(AppDbContext context) { 
        if(!context.Residents.Any()) {
            
            int resId = 1;
            var residentFaker = new Faker<Resident>()
                .RuleFor(r => r.ResidentId, f => resId++) 
                .RuleFor(r => r.FirstName, f => f.Name.FirstName())
                .RuleFor(r => r.MiddleName, f => f.Name.LastName())
                .RuleFor(r => r.LastName, f => f.Name.LastName())
                .RuleFor(r => r.Suffix, f => f.Name.Suffix())
                .RuleFor(r => r.BirthDate, f => f.Date.PastDateOnly(80))
                .RuleFor(r => r.Sector, f => f.PickRandom<Sector>())
                .RuleFor(r => r.Sex, f => f.PickRandom<Sex>())
                .RuleFor(r => r.CivilStatus, f => f.PickRandom<CivilStatus>())
                .RuleFor(r => r.Address, f => $"BLOCK {f.Random.Number(1, 9)}");

            var residents = residentFaker.Generate(2000);
            context.Residents.AddRange(residents);
        
        }
        

        if(!context.Transactions.Any()) {

            int transId = 1;
            var transactionFaker = new Faker<Transaction>()
                .RuleFor(t => t.Id, f => transId++)
                .RuleFor(t => t.RequesterId, f => f.Random.Number(1, 2000))
                .RuleFor(t => t.HandlerId, f => f.Random.Number(1, 9))
                .RuleFor(t => t.TypeOfDocument, f => f.PickRandom<DocumentType>())
                .RuleFor(t => t.Status, f => f.PickRandom<TransactionStatus>())
                .RuleFor(t => t.Date, f => f.Date.Past(20));

            var transactions = transactionFaker.Generate(1000);
            context.Transactions.AddRange(transactions);

        }

        context.SaveChanges();
    }
}
