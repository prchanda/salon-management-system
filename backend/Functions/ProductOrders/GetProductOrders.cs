using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.ProductOrders;

public class GetProductOrders
{
    private readonly SalonDbContext _context;

    public GetProductOrders(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — list every retail order, newest first.</summary>
    [Function("GetProductOrders")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "product-orders")]
        HttpRequestData req)
    {
        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var status = query["status"]?.Trim();

        IQueryable<Entities.ProductOrder> q = _context.ProductOrders;
        if (!string.IsNullOrEmpty(status))
        {
            q = q.Where(o => o.Status == status);
        }

        var orders = await q
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(orders);
        return response;
    }
}
