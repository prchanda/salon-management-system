using backend.Data;
using backend.DTOs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

/// <summary>
/// Updates a customer's core details (name, phone, email) from the reception
/// profile page. Phone is optional but must stay unique when present.
/// </summary>
public class UpdateCustomer
{
    private readonly SalonDbContext _context;

    public UpdateCustomer(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdateCustomer")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "customers/{id}")]
        HttpRequestData req,
        long id)
    {
        UpdateCustomerDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<UpdateCustomerDto>();
        }
        catch
        {
            return await Bad(req, "Invalid JSON body.");
        }

        if (dto is null) return await Bad(req, "Missing body.");

        var customer = await _context.Customers.FirstOrDefaultAsync(x => x.Id == id);
        if (customer is null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var fullName = (dto.FullName ?? string.Empty).Trim();
        var phone = (dto.PhoneNumber ?? string.Empty).Trim();
        var email = (dto.Email ?? string.Empty).Trim();

        if (fullName.Length < 2 || fullName.Length > 80)
        {
            return await Bad(req, "Full name must be 2 to 80 characters.");
        }

        var hasPhone = phone.Length > 0;
        if (hasPhone && !System.Text.RegularExpressions.Regex.IsMatch(phone, @"^\d{10}$"))
        {
            return await Bad(req, "Phone number must be exactly 10 digits.");
        }

        var hasEmail = email.Length > 0;
        if (hasEmail &&
            (email.Length > 120 ||
             !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$")))
        {
            return await Bad(req, "Please provide a valid email address.");
        }

        if (hasPhone)
        {
            var phoneTaken = await _context.Customers
                .AnyAsync(x => x.Id != id && x.PhoneNumber == phone);
            if (phoneTaken)
            {
                return await Bad(req, "That phone number is already registered to another customer.");
            }
        }

        customer.FullName = fullName;
        customer.PhoneNumber = hasPhone ? phone : null;
        customer.Email = hasEmail ? email : null;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(customer);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var response = req.CreateResponse(HttpStatusCode.BadRequest);
        await response.WriteAsJsonAsync(new { message });
        return response;
    }
}
