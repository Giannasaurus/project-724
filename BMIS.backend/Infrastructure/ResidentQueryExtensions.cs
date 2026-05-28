using BMIS.Models.Entities;
using BMIS.Models;

namespace BMIS.Infrastructure;

public static class ResidentQueryExtensions {
    public static IQueryable<Resident> ApplySeniorFilter(this IQueryable<Resident> query, bool? isSenior) {
        if(isSenior == null) {
            return query;
        }

        return query.Where(r => r.IsSenior == isSenior);
    }
    
    public static IQueryable<Resident> ApplyPWDFilter(this IQueryable<Resident> query, bool? isPWD) {
        if(isPWD == null) {
            return query;
        }

        return query.Where(r => r.IsPWD == isPWD);
    }

    public static IQueryable<Resident> ApplyAgeFilter(this IQueryable<Resident> query, int? minAge, int? maxAge) {
        DateOnly minCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-minAge ?? 0);
        DateOnly maxCutoff = DateOnly.FromDateTime(DateTime.Now).AddYears(-maxAge ?? -999);
        query = query.Where(r => maxCutoff <= r.BirthDate && r.BirthDate <= minCutoff);

        return query;
    }

    public static IQueryable<Resident> ApplySexFilter(this IQueryable<Resident> query, List<string>? sexes) {
        if(!sexes.Any()) {
            return query;
        }

        HashSet<Sex> valid = new HashSet<Sex>();
        foreach(var s in sexes) {
            if(Enum.TryParse<Sex>(s, true, out Sex parsed)) {
                valid.Add(parsed);
            }
        }
        
        query = query.Where(r => valid.Contains(r.Sex)); 
        return query;
    }
    
    public static IQueryable<Resident> ApplyCivilStatusFilter(this IQueryable<Resident> query, List<string>? civilStatuses) {
        if(!civilStatuses.Any()) {
            return query;
        }

        HashSet<CivilStatus> valid = new HashSet<CivilStatus>();
        foreach(var s in civilStatuses) {
            if(Enum.TryParse<CivilStatus>(s, true, out CivilStatus parsed)) {
                valid.Add(parsed);
            }
        }
        
        query = query.Where(r => valid.Contains(r.CivilStatus)); 
        return query;
    }

    public static IQueryable<Resident> ApplyHeadFilter(this IQueryable<Resident> query, bool? isHead) {
        if(isHead == null) {
            return query;
        }

        return query.Where(r => r.IsHead == isHead);
    }
}
