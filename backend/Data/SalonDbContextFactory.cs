using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace backend.Data;

public class SalonDbContextFactory : IDesignTimeDbContextFactory<SalonDbContext>
{
    public SalonDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("local.settings.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        var connectionString =
            configuration["Values:ConnectionStrings:DefaultConnection"];

        var optionsBuilder = new DbContextOptionsBuilder<SalonDbContext>();

        optionsBuilder.UseNpgsql(connectionString);

        return new SalonDbContext(optionsBuilder.Options);
    }
}