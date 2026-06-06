using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Products;

public class GetAdminProductById
{
    private readonly SalonDbContext _context;

    public GetAdminProductById(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — fetch a product (active or hidden) by id, used by the editor.</summary>
    [Function("GetAdminProductById")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "products/admin/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return req.CreateResponse(HttpStatusCode.NotFound);

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(product);
        return response;
    }
}
