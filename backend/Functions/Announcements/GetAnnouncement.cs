using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Announcements;

/// <summary>
/// Public read of the live announcement bar. Returns the announcement only
/// while it is active AND inside its optional start/end window; otherwise
/// returns 200 with a JSON <c>null</c> body so the public site shows nothing.
/// </summary>
public class GetAnnouncement
{
    private readonly SalonDbContext _context;

    public GetAnnouncement(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetAnnouncement")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "announcement")]
        HttpRequestData req)
    {
        var now = DateTime.UtcNow;

        var announcement = await _context.Announcements
            .AsNoTracking()
            .Where(a => a.IsActive
                && (a.StartsAt == null || a.StartsAt <= now)
                && (a.EndsAt == null || a.EndsAt >= now)
                && a.Message != "")
            .OrderByDescending(a => a.UpdatedAt)
            .FirstOrDefaultAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(announcement);
        return response;
    }
}
