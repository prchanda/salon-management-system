using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Web;

namespace backend.Functions.Appointments;

/// <summary>
/// Returns all appointments for a given day (defaults to today, IST-friendly).
/// Used by the reception "today view".
/// </summary>
public class GetTodayAppointments
{
    private readonly SalonDbContext _context;

    public GetTodayAppointments(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetTodayAppointments")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "appointments/today")]
        HttpRequestData req)
    {
        var query = HttpUtility.ParseQueryString(req.Url.Query);

        var dateRaw = query["date"];
        var staffIdRaw = query["staffId"];

        var date = !string.IsNullOrWhiteSpace(dateRaw) && DateOnly.TryParse(dateRaw, out var parsed)
            ? parsed
            : DateOnly.FromDateTime(DateTime.UtcNow);

        long? staffIdFilter = null;
        if (!string.IsNullOrWhiteSpace(staffIdRaw) && long.TryParse(staffIdRaw, out var sid))
        {
            staffIdFilter = sid;
        }

        var q = _context.Appointments
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Staff)
            .Include(x => x.Service)
            .Where(x => x.AppointmentDate == date);

        if (staffIdFilter is long filterId)
        {
            q = q.Where(x => x.StaffId == filterId);
        }

        var appointments = await q
            .OrderBy(x => x.AppointmentTime)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            Date = date,
            Appointments = appointments
        });

        return response;
    }
}
