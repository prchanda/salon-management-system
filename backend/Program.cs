using System.Text.Json;
using System.Text.Json.Serialization;
using Azure.Core.Serialization;
using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

var connectionString =
    builder.Configuration["ConnectionStrings:DefaultConnection"];

builder.Services.AddDbContext<SalonDbContext>(options =>
    options.UseNpgsql(connectionString));

// Emit camelCase JSON so the Next.js client (which expects camelCase
// property names) can deserialize responses directly.
builder.Services.Configure<WorkerOptions>(workerOptions =>
{
    var jsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    workerOptions.Serializer = new JsonObjectSerializer(jsonOptions);
});

var host = builder.Build();

// Bootstrap the salon-owner account from configuration (never from source).
// Supabase can be briefly unreachable right as the host starts, so retry a
// few times before giving up rather than leaving the owner unseeded.
using (var scope = host.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SalonDbContext>();
    const int maxAttempts = 5;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            OwnerSeeder.Seed(db, builder.Configuration);
            break;
        }
        catch (Exception ex)
        {
            if (attempt == maxAttempts)
            {
                // Don't take the whole host down on a persistent seed failure.
                Console.Error.WriteLine(
                    $"[OwnerSeeder] Failed to seed owner account after {maxAttempts} attempts: {ex.Message}");
                break;
            }

            Console.Error.WriteLine(
                $"[OwnerSeeder] Seed attempt {attempt} failed ({ex.Message}); retrying…");
            Thread.Sleep(TimeSpan.FromSeconds(2 * attempt));
        }
    }
}

host.Run();