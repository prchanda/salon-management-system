using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

public class GetCustomers
{
    private readonly SalonDbContext _context;

    public GetCustomers(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetCustomers")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "customers")]
        HttpRequestData req)
    {
        var customers = await _context.Customers
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(customers);

        return response;
    }
}