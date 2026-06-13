using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;

namespace backend.Functions.Services;

public class CreateService
{
    private const int MaxName = 160;
    private const int MaxDescription = 2000;
    private const int MaxDurationMinutes = 24 * 60; // 24 hours

    private readonly SalonDbContext _context;

    public CreateService(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CreateService")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "services")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<CreateServiceDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        var name = (dto.ServiceName ?? string.Empty).Trim();
        var description = (dto.Description ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length > MaxName)
            return await Bad(req, $"serviceName is required (max {MaxName} chars).");
        if (description.Length > MaxDescription)
            return await Bad(req, $"description must be {MaxDescription} chars or fewer.");
        if (dto.DurationMinutes is null || dto.DurationMinutes <= 0 || dto.DurationMinutes > MaxDurationMinutes)
            return await Bad(req, $"durationMinutes is required and must be between 1 and {MaxDurationMinutes}.");
        if (dto.Price is null || dto.Price < 0)
            return await Bad(req, "price is required and must be ≥ 0.");

        var category = ServiceCategories.TryNormalize(dto.Category) ?? ServiceCategories.Default;

        var service = new Service
        {
            ServiceName = name,
            Category = category,
            Description = string.IsNullOrWhiteSpace(description) ? null : description,
            DurationMinutes = dto.DurationMinutes.Value,
            Price = dto.Price.Value,
            IsActive = dto.IsActive ?? true,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.Created);
        await response.WriteAsJsonAsync(service);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
