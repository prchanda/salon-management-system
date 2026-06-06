using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Products;

public class DeleteProduct
{
    private readonly SalonDbContext _context;

    public DeleteProduct(SalonDbContext context)
    {
        _context = context;
    }

    [Function("DeleteProduct")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "products/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return req.CreateResponse(HttpStatusCode.NotFound);

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return req.CreateResponse(HttpStatusCode.NoContent);
    }
}
