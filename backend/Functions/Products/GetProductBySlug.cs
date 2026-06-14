using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Products;

public class GetProductBySlug
{
    private readonly SalonDbContext _context;

    public GetProductBySlug(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Public — single product detail by slug (only if active).</summary>
    [Function("GetProductBySlug")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "products/{slug}")]
        HttpRequestData req,
        string slug)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive);
        if (product is null) return req.CreateResponse(HttpStatusCode.NotFound);

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(product);
        return response;
    }
}
