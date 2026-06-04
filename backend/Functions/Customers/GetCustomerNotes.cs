using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

public class GetCustomerNotes
{
    private readonly SalonDbContext _context;

    public GetCustomerNotes(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetCustomerNotes")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "customers/{id}/notes")]
        HttpRequestData req,
        long id)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(x => x.Id == id);

        if (customer == null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            CustomerId = customer.Id,
            FullName = customer.FullName,
            Notes = customer.Notes
        });

        return response;
    }
}
