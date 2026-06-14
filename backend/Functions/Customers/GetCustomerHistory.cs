using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

/// <summary>
/// Returns a customer profile plus visit history, lifetime value, and last visit.
/// Powers the customer profile view in the reception app.
/// </summary>
public class GetCustomerHistory
{
    private readonly SalonDbContext _context;

    public GetCustomerHistory(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetCustomerHistory")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "customers/{id}/history")]
        HttpRequestData req,
        long id)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (customer == null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var appointments = await _context.Appointments
            .AsNoTracking()
            .Include(x => x.Service)
            .Include(x => x.Staff)
            .Where(x => x.CustomerId == id)
            .OrderByDescending(x => x.AppointmentDate)
            .ThenByDescending(x => x.AppointmentTime)
            .Take(50)
            .ToListAsync();

        var doneAppointments = appointments.Where(x => x.Status == "Done").ToList();

        var lifetimeValue = doneAppointments.Sum(x => x.AmountPaid ?? 0);

        var lastVisit = doneAppointments
            .OrderByDescending(x => x.AppointmentDate)
            .FirstOrDefault();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            Customer = customer,
            Stats = new
            {
                VisitCount = doneAppointments.Count,
                LifetimeValue = lifetimeValue,
                LastVisitDate = lastVisit?.AppointmentDate
            },
            Appointments = appointments
        });

        return response;
    }
}
