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

        var dormantIds = lastVisits
            .Where(x => x.LastVisit < cutoff)
            .Select(x => x.CustomerId)
            .ToHashSet();

        var customers = await _context.Customers
            .Where(c => dormantIds.Contains(c.Id))
            .OrderBy(c => c.FullName)
            .ToListAsync();

        var enriched = customers.Select(c => new
        {
            Customer = c,
            LastVisit = lastVisits.First(v => v.CustomerId == c.Id).LastVisit
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
