using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

public class GetCustomerByPhone
{
    private readonly SalonDbContext _context;

    public GetCustomerByPhone(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetCustomerByPhone")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "customers/by-phone/{phone}")]
        HttpRequestData req,
        string phone)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(x => x.PhoneNumber == phone);

        if (customer == null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(customer);

        return response;
    }
}
