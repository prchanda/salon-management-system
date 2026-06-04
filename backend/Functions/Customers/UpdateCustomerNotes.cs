using backend.Data;
using backend.DTOs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

public class UpdateCustomerNotes
{
    private readonly SalonDbContext _context;

    public UpdateCustomerNotes(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdateCustomerNotes")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "customers/{id}/notes")]
        HttpRequestData req,
        long id)
    {
        var dto = await req.ReadFromJsonAsync<UpdateCustomerNotesDto>();

        var customer = await _context.Customers
            .FirstOrDefaultAsync(x => x.Id == id);

        if (customer == null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        customer.Notes = dto?.Notes;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(customer);

        return response;
    }
}
