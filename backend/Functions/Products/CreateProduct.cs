using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;

namespace backend.Functions.Products;

public class CreateProduct
{
    private const int MaxName = 160;
    private const int MaxCategory = 60;
    private const int MaxShort = 240;
    private const int MaxDescription = 6000;

    private readonly SalonDbContext _context;

    public CreateProduct(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CreateProduct")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "products")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<CreateProductDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        var name = (dto.Name ?? string.Empty).Trim();
        var description = (dto.Description ?? string.Empty).Trim();
        var category = (dto.Category ?? string.Empty).Trim();
        var shortDescription = (dto.ShortDescription ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length > MaxName)
            return await Bad(req, $"name is required (max {MaxName} chars).");
        if (category.Length > MaxCategory)
            return await Bad(req, $"category must be {MaxCategory} chars or fewer.");
        if (shortDescription.Length > MaxShort)
            return await Bad(req, $"shortDescription must be {MaxShort} chars or fewer.");
        if (description.Length > MaxDescription)
            return await Bad(req, $"description must be {MaxDescription} chars or fewer.");
        if (dto.Price is null || dto.Price < 0)
            return await Bad(req, "price is required and must be ≥ 0.");
        if (dto.StockQuantity.HasValue && dto.StockQuantity.Value < 0)
            return await Bad(req, "stockQuantity must be ≥ 0.");

        var baseSlug = SlugHelper.Slugify(name);
        var slug = SlugHelper.Unique(baseSlug, s => _context.Products.Any(p => p.Slug == s));

        var now = DateTime.UtcNow;
        var product = new Product
        {
            Slug = slug,
            Name = name,
            Category = string.IsNullOrWhiteSpace(category) ? null : category,
            ShortDescription = string.IsNullOrWhiteSpace(shortDescription) ? null : shortDescription,
            Description = description,
            Price = dto.Price.Value,
            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl!.Trim(),
            StockQuantity = dto.StockQuantity,
            IsActive = dto.IsActive ?? true,
            CreatedAt = now,
            UpdatedAt = now,
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.Created);
        await response.WriteAsJsonAsync(product);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
