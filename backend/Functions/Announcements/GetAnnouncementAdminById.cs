using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Announcements;

/// <summary>
/// Owner-only read of a single announcement by id (regardless of whether it is
/// currently live), used to pre-fill the reception editor. Privileged — not in
/// the public allow-list. Returns 404 when no such announcement exists.
/// </summary>
public class GetAnnouncementAdminById
{
    private readonly SalonDbContext _context;

    public GetAnnouncementAdminById(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetAnnouncementAdminById")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "announcement/admin/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var announcement = await _context.Announcements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement is null) return req.CreateResponse(HttpStatusCode.NotFound);

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(announcement);
        return response;
    }
}
