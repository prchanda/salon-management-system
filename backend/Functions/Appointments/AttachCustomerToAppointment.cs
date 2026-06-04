using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Appointments;

/// <summary>
/// Back-fills a customer link on an existing appointment ("claim later").
/// Useful when a walk-in declined to share their phone at check-in and the
/// receptionist captures it later (e.g. while taking payment).
/// </summary>
public class AttachCustomerToAppointment
{
    private readonly SalonDbContext _context;

    public AttachCustomerToAppointment(SalonDbContext context)
    {
        _context = context;
    }

    [Function("AttachCustomerToAppointment")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "appointments/{id}/attach-customer")]
        HttpRequestData req,
        long id)
    {
        var dto = await req.ReadFromJsonAsync<AttachCustomerDto>();

        if (dto == null || string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteStringAsync("phoneNumber is required.");
            return bad;
        }

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (appointment == null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var phone = dto.PhoneNumber.Trim();
        var name = string.IsNullOrWhiteSpace(dto.FullName) ? null : dto.FullName!.Trim();

        var customer = await _context.Customers
            .FirstOrDefaultAsync(x => x.PhoneNumber == phone);

        if (customer == null)
        {
            customer = new Customer
            {
                FullName = name ?? appointment.GuestName ?? "Guest",
                PhoneNumber = phone,
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }
        else if (name != null && (string.IsNullOrWhiteSpace(customer.FullName) || customer.FullName == "Guest"))
        {
            // Improve a placeholder name when reception now has a real one.
            customer.FullName = name;
        }

        appointment.CustomerId = customer.Id;
        appointment.GuestName = null;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            Appointment = appointment,
            Customer = customer
        });

        return response;
    }
}
