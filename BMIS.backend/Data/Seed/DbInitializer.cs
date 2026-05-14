using Bogus;
using BMIS.Models;
using BMIS.Models.Entities;

public static class DbInitializer {
    public static void Initialize(AppDbContext context) { 
        if(!context.Residents.Any()) {

            var phPrefixes = new[] { "+63 917", "+63 915", "+63 927", "+63 918", "+63 919", "+63 920", "+63 991" };
            
            var residentFaker = new Faker<Resident>()
                .CustomInstantiator(f => new Resident(
                        f.Name.FirstName(),
                        f.Name.LastName().OrNull(f, 0.3f),
                        f.Name.LastName(),
                        f.Name.Suffix().OrNull(f, 0.7f),
                        f.Date.PastDateOnly(80),
                        f.PickRandom<Sector>(),
                        f.PickRandom<Sex>(),
                        f.PickRandom<CivilStatus>(),
                        $"BLOCK {f.Random.Number(1, 9)}",
                        f.PickRandom(phPrefixes) + f.Random.Replace(" ### ####")
                    ));

            var residents = residentFaker.Generate(2000);
            context.Residents.AddRange(residents);
        
        }
        

        if(!context.Transactions.Any()) {

            var transactionFaker = new Faker<Transaction>()
                .CustomInstantiator(f => new Transaction(
                    f.Random.Number(1, 2000),
                    f.Random.Number(1, 9),
                    f.PickRandom<DocumentType>(),
                    f.PickRandom<TransactionStatus>(),
                    f.Date.Past(20)
                ));

            var transactions = transactionFaker.Generate(1000);
            context.Transactions.AddRange(transactions);

        }

        context.SaveChanges();
    }
}
