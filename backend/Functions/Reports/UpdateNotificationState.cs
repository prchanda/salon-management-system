using backend.Data;
using backend.Entities;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Reports;

/// <summary>
/// Writes the reception bell's per-viewer read state so it syncs across every
/// device the user signs in from. The viewer id (their <see cref="Staff"/> id,
/// owner included) is supplied by the trusted frontend route from signed
/// cookies — clients never send it directly.
/// </summary>
public class UpdateNotificationState
{
    private readonly SalonDbContext _context;

    // Keep the dismissed list bounded — events age out of the 7-day window so
    // far more than this is never needed.
    private const int MaxDismissed = 500;

    public UpdateNotificationState(SalonDbContext context)
    {
        _context = context;
    }

    private record SeenRequest(long? ViewerId, DateTime? LastSeenAt);
    private record DismissRequest(long? ViewerId, string? Id);

    /// <summary>Mark the bell as seen up to a given moment.</summary>
    [Function("MarkNotificationsSeen")]
    public async Task<HttpResponseData> Seen(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "notifications/seen")]
        HttpRequestData req)
    {
        var dto = await ReadBodyAsync<SeenRequest>(req);
        if (dto?.ViewerId is not long viewerId || viewerId <= 0)
        {
            // No attributable viewer — nothing to record, but not an error.
            return await OkAsync(req, null, Array.Empty<string>());
        }

        var stamp = (dto.LastSeenAt ?? DateTime.UtcNow).ToUniversalTime();

        var state = await UpsertAsync(viewerId, s =>
        {
            if (s.LastSeenAt is null || stamp > s.LastSeenAt)
            {
                s.LastSeenAt = stamp;
            }
        });

        return await OkAsync(req, state.LastSeenAt, GetNotifications.DeserializeIds(state.DismissedIdsJson));
    }

    /// <summary>Dismiss a single notification by id.</summary>
    [Function("DismissNotification")]
    public async Task<HttpResponseData> Dismiss(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "notifications/dismiss")]
        HttpRequestData req)
    {
        var dto = await ReadBodyAsync<DismissRequest>(req);
        if (dto?.ViewerId is not long viewerId || viewerId <= 0 ||
            string.IsNullOrWhiteSpace(dto.Id))
        {
            return await OkAsync(req, null, Array.Empty<string>());
        }

        var id = dto.Id.Trim();

        var state = await UpsertAsync(viewerId, s =>
        {
            var ids = GetNotifications.DeserializeIds(s.DismissedIdsJson).ToList();
            if (!ids.Contains(id))
            {
                ids.Add(id);
                if (ids.Count > MaxDismissed)
                {
                    ids = ids.Skip(ids.Count - MaxDismissed).ToList();
                }
                s.DismissedIdsJson = System.Text.Json.JsonSerializer.Serialize(ids);
            }
        });

        return await OkAsync(req, state.LastSeenAt, GetNotifications.DeserializeIds(state.DismissedIdsJson));
    }

    /// <summary>
    /// Load (or create) the viewer's state row, apply the mutation and save.
    /// Retries once on the unique-index race where two devices create the row
    /// at the same time.
    /// </summary>
    private async Task<NotificationState> UpsertAsync(long viewerId, Action<NotificationState> mutate)
    {
        for (var attempt = 0; attempt < 2; attempt++)
        {
            var state = await _context.NotificationStates
                .FirstOrDefaultAsync(s => s.StaffId == viewerId);

            var isNew = state is null;
            if (state is null)
            {
                state = new NotificationState
                {
                    StaffId = viewerId,
                    DismissedIdsJson = "[]",
                };
                _context.NotificationStates.Add(state);
            }

            mutate(state);
            state.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return state;
            }
            catch (DbUpdateException) when (isNew && attempt == 0)
            {
                // Another device inserted the row first — drop our duplicate
                // and retry against the now-existing row.
                _context.Entry(state).State = EntityState.Detached;
            }
        }

        // Should be unreachable, but return the current row if reached.
        return await _context.NotificationStates.FirstAsync(s => s.StaffId == viewerId);
    }

    private static async Task<T?> ReadBodyAsync<T>(HttpRequestData req)
    {
        try
        {
            return await req.ReadFromJsonAsync<T>();
        }
        catch
        {
            return default;
        }
    }

    private static async Task<HttpResponseData> OkAsync(
        HttpRequestData req, DateTime? lastSeenAt, string[] dismissedIds)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            LastSeenAt = lastSeenAt,
            DismissedIds = dismissedIds,
        });
        return response;
    }
}
