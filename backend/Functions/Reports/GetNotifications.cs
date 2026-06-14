using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Web;

namespace backend.Functions.Reports;

/// <summary>
/// Aggregated notification feed for the reception desk. Returns recent
/// "things that happened" (new bookings, product orders, reviews and staff
/// sign-ups) so the UI can show an attention-grabbing bell with toasts.
///
/// Scope is decided by the trusted frontend route (it reads the signed
/// reception cookies and forwards <c>scope</c>/<c>specialistId</c>): the
/// owner sees everything; a staff member only sees their own new bookings.
/// </summary>
public class GetNotifications
{
    private readonly SalonDbContext _context;

    // Keep the payload small — the bell only ever shows a short recent list.
    private const int DefaultLimit = 30;
    private const int MaxLimit = 50;

    // How far back to look when the caller doesn't pass an explicit cursor.
    private static readonly TimeSpan DefaultWindow = TimeSpan.FromDays(7);

    public GetNotifications(SalonDbContext context)
    {
        _context = context;
    }

    private record NotificationEvent(
        string Id,
        string Kind,
        string Title,
        string Subtitle,
        DateTime CreatedAt,
        string Href);

    [Function("GetNotifications")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "notifications")]
        HttpRequestData req)
    {
        var query = HttpUtility.ParseQueryString(req.Url.Query);

        var sinceRaw = query["since"];
        DateTime since;
        if (!string.IsNullOrWhiteSpace(sinceRaw) &&
            DateTime.TryParse(
                sinceRaw,
                null,
                System.Globalization.DateTimeStyles.AdjustToUniversal |
                System.Globalization.DateTimeStyles.AssumeUniversal,
                out var parsedSince))
        {
            since = parsedSince.ToUniversalTime();
        }
        else
        {
            since = DateTime.UtcNow - DefaultWindow;
        }

        var limit = DefaultLimit;
        if (int.TryParse(query["limit"], out var parsedLimit) && parsedLimit > 0)
        {
            limit = Math.Min(parsedLimit, MaxLimit);
        }

        // Staff scope: only their own bookings. The frontend route is the
        // trusted boundary that sets these (derived from signed cookies), so
        // the backend simply honours them.
        var staffScope = string.Equals(query["scope"], "staff", StringComparison.OrdinalIgnoreCase);
        long? specialistId = null;
        if (long.TryParse(query["specialistId"], out var sid) && sid > 0)
        {
            specialistId = sid;
        }

        // The signed-in user's own Staff id (owner included), forwarded by the
        // trusted frontend route. Used to read/write their cross-device bell
        // state (last-seen + dismissed ids).
        long? viewerId = null;
        if (long.TryParse(query["viewerId"], out var vid) && vid > 0)
        {
            viewerId = vid;
        }

        var events = new List<NotificationEvent>();

        // ── New bookings ────────────────────────────────────────────────
        var bookingsQuery = _context.Appointments
            .AsNoTracking()
            .Include(a => a.Customer)
            .Include(a => a.Service)
            .Where(a => a.CreatedAt > since);

        if (staffScope)
        {
            // A staff member only cares about bookings assigned to them. With
            // no resolvable id there is nothing they may see.
            if (specialistId is not long mine) return await EmptyAsync(req);
            bookingsQuery = bookingsQuery.Where(a => a.StaffId == mine);
        }

        var bookings = await bookingsQuery
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .Select(a => new
            {
                a.Id,
                a.CreatedAt,
                a.AppointmentDate,
                a.AppointmentTime,
                CustomerName = a.Customer != null ? a.Customer.FullName : a.GuestName,
                ServiceName = a.Service != null ? a.Service.ServiceName : null,
            })
            .ToListAsync();

        foreach (var b in bookings)
        {
            var who = string.IsNullOrWhiteSpace(b.CustomerName) ? "Walk-in" : b.CustomerName!;
            var svc = string.IsNullOrWhiteSpace(b.ServiceName) ? "appointment" : b.ServiceName!;
            // Deep-link to the booking's own day view, focused on the row.
            var href = $"/reception?date={b.AppointmentDate:yyyy-MM-dd}&focus=appt-{b.Id}";
            events.Add(new NotificationEvent(
                $"booking-{b.Id}",
                "booking",
                "New booking",
                $"{who} · {svc} at {b.AppointmentTime:HH:mm}",
                b.CreatedAt,
                href));
        }

        // Staff stop here — orders, reviews and sign-ups are owner-only.
        if (!staffScope)
        {
            // ── New product orders ──────────────────────────────────────
            var orders = await _context.ProductOrders
                .AsNoTracking()
                .Where(o => o.CreatedAt > since)
                .OrderByDescending(o => o.CreatedAt)
                .Take(limit)
                .Select(o => new { o.Id, o.CreatedAt, o.ProductName, o.CustomerName, o.Quantity })
                .ToListAsync();

            foreach (var o in orders)
            {
                events.Add(new NotificationEvent(
                    $"order-{o.Id}",
                    "order",
                    "New order",
                    $"{o.CustomerName} · {o.Quantity}× {o.ProductName}",
                    o.CreatedAt,
                    $"/reception/orders?focus=order-{o.Id}"));
            }

            // ── New reviews ─────────────────────────────────────────────
            var reviews = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.CreatedAt > since)
                .OrderByDescending(r => r.CreatedAt)
                .Take(limit)
                .Select(r => new { r.Id, r.CreatedAt, r.AuthorName, r.Rating })
                .ToListAsync();

            foreach (var r in reviews)
            {
                events.Add(new NotificationEvent(
                    $"review-{r.Id}",
                    "review",
                    "New review",
                    $"{r.AuthorName} · {r.Rating}★",
                    r.CreatedAt,
                    $"/reception/reviews?focus=review-{r.Id}"));
            }

            // ── New staff sign-ups awaiting approval ────────────────────
            var signups = await _context.Staff
                .AsNoTracking()
                .Where(s => s.RegisteredAt != null
                            && s.RegisteredAt > since
                            && !s.IsApproved
                            && !s.IsOwner)
                .OrderByDescending(s => s.RegisteredAt)
                .Take(limit)
                .Select(s => new { s.Id, s.RegisteredAt, s.FullName })
                .ToListAsync();

            foreach (var s in signups)
            {
                events.Add(new NotificationEvent(
                    $"signup-{s.Id}",
                    "signup",
                    "New staff sign-up",
                    $"{s.FullName} · awaiting approval",
                    s.RegisteredAt!.Value,
                    $"/reception/staff?focus=staff-{s.Id}"));
            }
        }

        var ordered = events
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .ToList();

        // Load the viewer's cross-device read state so every device converges:
        // dismissed events stay hidden and the unread baseline is shared.
        DateTime? lastSeenAt = null;
        string[] dismissedIds = Array.Empty<string>();
        if (viewerId is long vid2)
        {
            var state = await _context.NotificationStates
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.StaffId == vid2);
            if (state is not null)
            {
                lastSeenAt = state.LastSeenAt;
                dismissedIds = DeserializeIds(state.DismissedIdsJson);
            }
        }

        var dismissedSet = new HashSet<string>(dismissedIds, StringComparer.Ordinal);
        var visible = ordered.Where(e => !dismissedSet.Contains(e.Id)).ToList();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            ServerTime = DateTime.UtcNow,
            LastSeenAt = lastSeenAt,
            DismissedIds = dismissedIds,
            Events = visible,
        });
        return response;
    }

    /// <summary>Parse the stored JSON id array, tolerating malformed data.</summary>
    internal static string[] DeserializeIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<string>();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<string[]>(json)
                ?? Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static async Task<HttpResponseData> EmptyAsync(HttpRequestData req)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            ServerTime = DateTime.UtcNow,
            LastSeenAt = (DateTime?)null,
            DismissedIds = Array.Empty<string>(),
            Events = Array.Empty<NotificationEvent>(),
        });
        return response;
    }
}
