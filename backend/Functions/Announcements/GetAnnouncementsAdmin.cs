using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Announcements;

/// <summary>
/// Owner-only list of every announcement (newest first), used by the reception
/// announcements page. Returns the raw records regardless of whether each is
/// currently live. Privileged — not in the public allow-list.
/// </summary>
public class GetAnnouncementsAdmin
{
    private readonly SalonDbContext _context;

    public GetAnnouncementsAdmin(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetAnnouncementsAdmin")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "announcement/admin")]
        HttpRequestData req)
    {
        var announcements = await _context.Announcements
            .AsNoTracking()
            .OrderByDescending(a => a.Id)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(announcements);
        return response;
    }
}
