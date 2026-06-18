using backend.Data;
using backend.DTOs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Announcements;

/// <summary>
/// Owner-only update of an existing announcement. Expired announcements (whose
/// end time has passed) are locked and cannot be edited. Privileged — the
/// API-key middleware gates it (the route is not in the public allow-list).
/// </summary>
public class UpdateAnnouncement
{
    private readonly SalonDbContext _context;

    public UpdateAnnouncement(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdateAnnouncement")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "announcement/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var announcement = await _context.Announcements.FirstOrDefaultAsync(a => a.Id == id);
        if (announcement is null) return req.CreateResponse(HttpStatusCode.NotFound);

        if (AnnouncementWrite.IsExpired(announcement, DateTime.UtcNow))
            return await Conflict(req, "This announcement has expired and can no longer be edited.");

        var dto = await req.ReadFromJsonAsync<UpdateAnnouncementDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        var error = AnnouncementWrite.Validate(dto);
        if (error is not null) return await Bad(req, error);

        AnnouncementWrite.Apply(announcement, dto);
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(announcement);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }

    private static async Task<HttpResponseData> Conflict(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.Conflict);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
