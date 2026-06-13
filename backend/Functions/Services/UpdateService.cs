using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Services;

public class UpdateService
{
    private const int MaxName = 160;
    private const int MaxDescription = 2000;
    private const int MaxDurationMinutes = 24 * 60; // 24 hours
    private const int MaxImageUrl = 1000;

    private readonly SalonDbContext _context;

    public UpdateService(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdateService")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "services/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == id);
        if (service is null) return req.CreateResponse(HttpStatusCode.NotFound);

        var dto = await req.ReadFromJsonAsync<UpdateServiceDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        if (dto.ServiceName != null)
        {
            var name = dto.ServiceName.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > MaxName)
                return await Bad(req, $"serviceName must be 1–{MaxName} chars.");
            service.ServiceName = name;
        }

        if (dto.Category != null)
        {
            var category = ServiceCategories.TryNormalize(dto.Category);
            if (category is null)
                return await Bad(req, $"category must be one of: {string.Join(", ", ServiceCategories.All)}.");
            service.Category = category;
        }

        if (dto.Description != null)
        {
            var d = dto.Description.Trim();
            if (d.Length > MaxDescription)
                return await Bad(req, $"description must be {MaxDescription} chars or fewer.");
            service.Description = string.IsNullOrWhiteSpace(d) ? null : d;
        }

        if (dto.DurationMinutes.HasValue)
        {
            if (dto.DurationMinutes.Value <= 0 || dto.DurationMinutes.Value > MaxDurationMinutes)
                return await Bad(req, $"durationMinutes must be between 1 and {MaxDurationMinutes}.");
            service.DurationMinutes = dto.DurationMinutes.Value;
        }

        if (dto.Price.HasValue)
        {
            if (dto.Price.Value < 0) return await Bad(req, "price must be ≥ 0.");
            service.Price = dto.Price.Value;
        }

        if (dto.ImageUrl != null)
        {
            var img = dto.ImageUrl.Trim();
            if (img.Length > MaxImageUrl)
                return await Bad(req, $"imageUrl must be {MaxImageUrl} chars or fewer.");
            service.ImageUrl = string.IsNullOrWhiteSpace(img) ? null : img;
        }

        if (dto.IsActive.HasValue)
        {
            service.IsActive = dto.IsActive.Value;
        }

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
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
