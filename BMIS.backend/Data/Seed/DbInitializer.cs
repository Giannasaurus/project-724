using Bogus;
using BMIS.Models;
using BMIS.Models.Entities;

using BMIS;

public static class DbInitializer {
    public static void Initialize(AppDbContext context) { 
        /* 
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
                        f.PickRandom(phPrefixes) + f.Random.Replace(" ### ####"),
                        f.Random.Number(1, 300)
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
        
        if(!context.HouseHolds.Any()) {
            HashSet<int> headIds = new HashSet<int>();
            var hhFaker = new Faker<HouseHold>()
                .RuleFor(h => h.Population, f => f.Random.Number(1, 5))
                .RuleFor(h => h.HeadId, f => {
                            int val;
                            do {
                                val = f.Random.Number(1, 2000);
                            } while(headIds.Contains(val));
                            headIds.Add(val);
                            return val;
                        });

            var hhs = hhFaker.Generate(300);
            context.HouseHolds.AddRange(hhs);
        }
        
        if(!context.Deaths.Any()) {
            HashSet<int> rId = new HashSet<int>();
            var faker = new Faker<Deceased>()
                .RuleFor(x => x.ResidentId, f => {
                            int val;
                            do {
                                val = f.Random.Number(1, 2000);
                            } while(rId.Contains(val));
                            rId.Add(val);
                            return val;
                        })
                .RuleFor(x => x.DateOfDeath, f => f.Date.Past(100));

            var gen = faker.Generate(200);
            context.Deaths.AddRange(gen);
        }

        context.SaveChanges();
        */ 
    }
}
