using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Appointments;

public class GetAppointments
{
    private readonly SalonDbContext _context;

    public GetAppointments(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetAppointments")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "appointments")]
        HttpRequestData req)
    {
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Staff)
            .Include(x => x.Service)
            .OrderByDescending(x => x.AppointmentDate)
            .Take(500)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(appointments);

        return response;
    }
}