using System.Text.Json;
using System.Text.Json.Serialization;
using Azure.Core.Serialization;
using backend.Data;
using backend.Helpers;
using backend.Middleware;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// Require the shared API key on every privileged endpoint (public endpoints are
// allowed through). Registered before the function executes so unauthorized
// requests are short-circuited with 401.
builder.UseMiddleware<ApiKeyMiddleware>();

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
// This runs in the background so it never blocks the host from accepting
// traffic — seeding on the request path was adding seconds to cold start,
// especially when Supabase was briefly slow and the retry loop kicked in.
// The owner account only matters for sign-in, which already tolerates a brief
// startup window, so eventual seeding is fine.
_ = Task.Run(async () =>
{
    const int maxAttempts = 5;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = host.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<SalonDbContext>();
            OwnerSeeder.Seed(db, builder.Configuration);
            break;
        }
        catch (Exception ex)
        {
            if (attempt == maxAttempts)
            {
                // Don't crash the background task on a persistent seed failure.
                Console.Error.WriteLine(
                    $"[OwnerSeeder] Failed to seed owner account after {maxAttempts} attempts: {ex.Message}");
                break;
            }

            Console.Error.WriteLine(
                $"[OwnerSeeder] Seed attempt {attempt} failed ({ex.Message}); retrying…");
            await Task.Delay(TimeSpan.FromSeconds(2 * attempt));
        }
    }
});

host.Run();