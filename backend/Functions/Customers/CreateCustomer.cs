using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

public class CreateCustomer
{
    private readonly SalonDbContext _context;

    public CreateCustomer(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CreateCustomer")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "customers")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<CreateCustomerDto>();

        if (dto == null || string.IsNullOrWhiteSpace(dto.FullName))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteStringAsync("fullName is required.");
            return bad;
        }

        var phone = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber!.Trim();

        if (phone != null)
        {
            var existing = await _context.Customers
                .FirstOrDefaultAsync(x => x.PhoneNumber == phone);

            if (existing != null)
            {
                var conflict = req.CreateResponse(HttpStatusCode.Conflict);
                await conflict.WriteAsJsonAsync(existing);
                return conflict;
            }
        }

        var customer = new Customer
        {
            FullName = dto.FullName.Trim(),
            PhoneNumber = phone,
            Email = dto.Email,
            CreatedAt = DateTime.UtcNow
        };

        _context.Customers.Add(customer);

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.Created);

        await response.WriteAsJsonAsync(customer);

        return response;
    }
}