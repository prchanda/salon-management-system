using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;

namespace backend.Functions.Announcements;

/// <summary>
/// Owner-only creation of a new announcement bar. Privileged — the API-key
/// middleware gates it (the route is not in the public allow-list).
/// </summary>
public class CreateAnnouncement
{
    private readonly SalonDbContext _context;

    public CreateAnnouncement(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CreateAnnouncement")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "announcement")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<UpdateAnnouncementDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        var error = AnnouncementWrite.Validate(dto);
        if (error is not null) return await Bad(req, error);

        var announcement = new Announcement();
        AnnouncementWrite.Apply(announcement, dto);

        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.Created);
        await response.WriteAsJsonAsync(announcement);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
