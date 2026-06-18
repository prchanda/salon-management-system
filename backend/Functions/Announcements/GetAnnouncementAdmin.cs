using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Announcements;

/// <summary>
/// Owner-only read of the raw announcement record (regardless of whether it is
/// currently live), used to pre-fill the reception editor. Returns 200 with a
/// JSON <c>null</c> body when no announcement has ever been saved.
/// </summary>
public class GetAnnouncementAdmin
{
    private readonly SalonDbContext _context;

    public GetAnnouncementAdmin(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetAnnouncementAdmin")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "announcement/admin")]
        HttpRequestData req)
    {
        var announcement = await _context.Announcements
            .AsNoTracking()
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(announcement);
        return response;
    }
}
