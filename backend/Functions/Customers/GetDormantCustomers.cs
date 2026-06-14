using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Web;

namespace backend.Functions.Customers;

/// <summary>
/// Customers who haven't visited (status="Done") in the last N days (default 30).
/// Reception calls these guests to re-engage them.
/// </summary>
public class GetDormantCustomers
{
    private readonly SalonDbContext _context;

    public GetDormantCustomers(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetDormantCustomers")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "customers/dormant")]
        HttpRequestData req)
    {
        var query = HttpUtility.ParseQueryString(req.Url.Query);

        var days = int.TryParse(query["days"], out var d) ? d : 30;

        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var lastVisits = await _context.Appointments
            .Where(x => x.Status == "Done" && x.CustomerId != null)
            .GroupBy(x => x.CustomerId!.Value)
            .Select(g => new
            {
                CustomerId = g.Key,
                LastVisit = g.Max(x => x.AppointmentDate)
            })
            .ToListAsync();

        var lastVisitById = lastVisits
            .Where(x => x.LastVisit < cutoff)
            .ToDictionary(x => x.CustomerId, x => x.LastVisit);

        var customers = await _context.Customers
            .AsNoTracking()
            .Where(c => lastVisitById.Keys.Contains(c.Id))
            .OrderBy(c => c.FullName)
            .ToListAsync();

        var enriched = customers.Select(c => new
        {
            Customer = c,
            LastVisit = lastVisitById[c.Id]
        });

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            DaysThreshold = days,
            Customers = enriched
        });

        return response;
    }
}
