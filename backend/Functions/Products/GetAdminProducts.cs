using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Products;

public class GetAdminProducts
{
    private readonly SalonDbContext _context;

    public GetAdminProducts(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — all products including hidden ones.</summary>
    [Function("GetAdminProducts")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "products/admin/list")]
        HttpRequestData req)
    {
        var products = await _context.Products
            .AsNoTracking()
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(products);
        return response;
    }
}
