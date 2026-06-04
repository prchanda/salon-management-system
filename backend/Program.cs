using System.Text.Json;
using System.Text.Json.Serialization;
using Azure.Core.Serialization;
using backend.Data;
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

builder.Build().Run();