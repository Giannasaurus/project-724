using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace BMIS;

public class GuidV7Convention : IModelFinalizingConvention {
    public void ProcessModelFinalizing(
            IConventionModelBuilder builder,
            IConventionContext<IConventionModelBuilder> context) {
        foreach(var entityType in builder.Metadata.GetEntityTypes()) {
            foreach(var property in entityType.GetProperties()) {
                if(property.ClrType == typeof(Guid) && property.IsPrimaryKey()) {
                    property.Builder.HasValueGenerator((_,_) => new GuidV7ValueGenerator());
                }
            }
        }
    }
}
