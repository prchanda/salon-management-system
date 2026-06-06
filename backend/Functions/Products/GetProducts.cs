using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Products;

public class GetProducts
{
    private const int DefaultLimit = 100;
    private const int MaxLimit = 200;

    private readonly SalonDbContext _context;

    public GetProducts(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Public — active products only, newest first.</summary>
    [Function("GetProducts")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "products")]
        HttpRequestData req)
    {
        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);

        var limit = DefaultLimit;
        if (int.TryParse(query["limit"], out var parsed) && parsed > 0)
        {
            limit = Math.Min(parsed, MaxLimit);
        }

        var category = query["category"]?.Trim();

        IQueryable<Entities.Product> q = _context.Products.Where(p => p.IsActive);
        if (!string.IsNullOrEmpty(category))
        {
            q = q.Where(p => p.Category != null && p.Category.ToLower() == category.ToLower());
        }

        var products = await q
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Slug,
                p.Name,
                p.Category,
                p.ShortDescription,
                p.Description,
                p.Price,
                p.ImageUrl,
                p.StockQuantity,
                p.IsActive,
                p.CreatedAt,
            })
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(products);
        return response;
    }
}
