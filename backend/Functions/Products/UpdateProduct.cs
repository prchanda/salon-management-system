using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Products;

public class UpdateProduct
{
    private const int MaxName = 160;
    private const int MaxCategory = 60;
    private const int MaxShort = 240;
    private const int MaxDescription = 6000;

    private readonly SalonDbContext _context;

    public UpdateProduct(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdateProduct")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "products/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return req.CreateResponse(HttpStatusCode.NotFound);

        var dto = await req.ReadFromJsonAsync<UpdateProductDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        if (dto.Name != null)
        {
            var name = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > MaxName)
                return await Bad(req, $"name must be 1–{MaxName} chars.");

            if (!string.Equals(product.Name, name, StringComparison.Ordinal))
            {
                product.Name = name;
                var baseSlug = SlugHelper.Slugify(name);
                product.Slug = SlugHelper.Unique(
                    baseSlug,
                    s => _context.Products.Any(p => p.Slug == s && p.Id != product.Id));
            }
        }

        if (dto.Category != null)
        {
            var c = dto.Category.Trim();
            if (c.Length > MaxCategory) return await Bad(req, $"category too long.");
            product.Category = string.IsNullOrWhiteSpace(c) ? null : c;
        }

        if (dto.ShortDescription != null)
        {
            var s = dto.ShortDescription.Trim();
            if (s.Length > MaxShort) return await Bad(req, $"shortDescription too long.");
            product.ShortDescription = string.IsNullOrWhiteSpace(s) ? null : s;
        }

        if (dto.Description != null)
        {
            var d = dto.Description.Trim();
            if (d.Length > MaxDescription) return await Bad(req, $"description too long.");
            product.Description = d;
        }

        if (dto.Price.HasValue)
        {
            if (dto.Price.Value < 0) return await Bad(req, "price must be ≥ 0.");
            product.Price = dto.Price.Value;
        }

        if (dto.ImageUrl != null)
        {
            product.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl)
                ? null
                : dto.ImageUrl.Trim();
        }

        if (dto.ClearStock == true)
        {
            product.StockQuantity = null;
        }
        else if (dto.StockQuantity.HasValue)
        {
            if (dto.StockQuantity.Value < 0) return await Bad(req, "stockQuantity must be ≥ 0.");
            product.StockQuantity = dto.StockQuantity.Value;
        }

        if (dto.IsActive.HasValue)
        {
            product.IsActive = dto.IsActive.Value;
        }

        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
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
