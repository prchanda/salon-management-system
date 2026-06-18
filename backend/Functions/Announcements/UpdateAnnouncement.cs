using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Announcements;

/// <summary>
/// Owner-only upsert of the singleton announcement bar. There is only ever one
/// row: the first existing row is updated, or a new one is created. Privileged
/// (the API-key middleware gates it — it is not in the public allow-list).
/// </summary>
public class UpdateAnnouncement
{
    private const int MaxMessage = 200;
    private const int MaxCtaLabel = 40;
    private const int MaxCtaHref = 500;

    private static readonly HashSet<string> AllowedThemes =
        new(StringComparer.OrdinalIgnoreCase) { "gold", "ink", "blush" };

    private readonly SalonDbContext _context;

    public UpdateAnnouncement(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdateAnnouncement")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "announcement")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<UpdateAnnouncementDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        var message = (dto.Message ?? "").Trim();
        if (string.IsNullOrWhiteSpace(message) || message.Length > MaxMessage)
            return await Bad(req, $"message must be 1–{MaxMessage} characters.");

        var theme = (dto.Theme ?? "gold").Trim().ToLowerInvariant();
        if (!AllowedThemes.Contains(theme))
            return await Bad(req, $"theme must be one of: {string.Join(", ", AllowedThemes)}.");

        var ctaLabel = (dto.CtaLabel ?? "").Trim();
        if (ctaLabel.Length > MaxCtaLabel)
            return await Bad(req, $"ctaLabel must be {MaxCtaLabel} characters or fewer.");

        var ctaHref = (dto.CtaHref ?? "").Trim();
        if (ctaHref.Length > MaxCtaHref)
            return await Bad(req, $"ctaHref must be {MaxCtaHref} characters or fewer.");

        // A link must be a same-site path or an http(s) URL — never javascript:
        // or other schemes that could run in the visitor's browser.
        if (ctaHref.Length > 0 && !IsSafeHref(ctaHref))
            return await Bad(req, "ctaHref must start with / or http:// or https://.");

        // A button needs both a label and a link, or neither.
        if ((ctaLabel.Length > 0) != (ctaHref.Length > 0))
            return await Bad(req, "Provide both a button label and link, or leave both blank.");

        if (dto.StartsAt.HasValue && dto.EndsAt.HasValue
            && dto.EndsAt.Value <= dto.StartsAt.Value)
            return await Bad(req, "The end time must be after the start time.");

        var announcement = await _context.Announcements
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync();

        var isNew = announcement is null;
        announcement ??= new Announcement();

        announcement.Message = message;
        announcement.CtaLabel = ctaLabel.Length > 0 ? ctaLabel : null;
        announcement.CtaHref = ctaHref.Length > 0 ? ctaHref : null;
        announcement.Theme = theme;
        announcement.IsActive = dto.IsActive;
        announcement.StartsAt = dto.StartsAt.HasValue
            ? DateTime.SpecifyKind(dto.StartsAt.Value, DateTimeKind.Utc)
            : null;
        announcement.EndsAt = dto.EndsAt.HasValue
            ? DateTime.SpecifyKind(dto.EndsAt.Value, DateTimeKind.Utc)
            : null;
        announcement.UpdatedAt = DateTime.UtcNow;

        if (isNew) _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(announcement);
        return response;
    }

    private static bool IsSafeHref(string href)
    {
        if (href.StartsWith("/", StringComparison.Ordinal)) return true;
        return Uri.TryCreate(href, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
