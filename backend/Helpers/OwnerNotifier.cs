using backend.Data;
using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Helpers;

/// <summary>
/// Best-effort email notifications to the salon owner when a new booking or
/// product order arrives. Every method swallows its own failures so a
/// notification problem (missing config, Resend outage, etc.) can never block
/// or fail the underlying booking/order flow — the record is already persisted
/// by the time these run.
/// </summary>
public static class OwnerNotifier
{
    private static string FrontendBase() =>
        Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")?.TrimEnd('/')
            ?? "http://localhost:3000";

    /// <summary>
    /// Prefer the owner's live profile email; fall back to the configured
    /// OWNER_EMAIL. Returns null when no owner email is available.
    /// </summary>
    private static async Task<string?> ResolveOwnerEmailAsync(SalonDbContext db)
    {
        var ownerEmail = await db.Staff
            .Where(s => s.IsOwner && s.IsActive && s.Email != null)
            .Select(s => s.Email)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(ownerEmail)) return ownerEmail;

        var configured = Environment.GetEnvironmentVariable("OWNER_EMAIL")?.Trim();
        return string.IsNullOrWhiteSpace(configured) ? null : configured;
    }

    public static async Task NotifyNewAppointmentAsync(
        SalonDbContext db,
        Appointment appt,
        Customer? customer,
        string serviceName,
        string? staffName)
    {
        try
        {
            var to = await ResolveOwnerEmailAsync(db);
            if (to is null) return;

            var who = customer?.FullName ?? appt.GuestName ?? "Walk-in";
            var phone = customer?.PhoneNumber;
            var deepLink =
                $"{FrontendBase()}/reception?date={appt.AppointmentDate:yyyy-MM-dd}&focus=appt-{appt.Id}";

            var rows = new List<string?>
            {
                Row("Customer", who),
                phone is null ? null : Row("Phone", phone),
                Row("Service", serviceName),
                staffName is null ? null : Row("Specialist", staffName),
                Row("Date", appt.AppointmentDate.ToString("dddd, dd MMM yyyy")),
                Row("Time", appt.AppointmentTime.ToString("h:mm tt")),
                string.IsNullOrWhiteSpace(appt.Remarks) ? null : Row("Notes", appt.Remarks!),
            };

            var html = BuildHtml(
                "A new booking just came in.",
                rows,
                deepLink,
                "Open this booking in the reception desk →");

            await EmailSender.SendAsync(to, $"New booking · {who}", html);
        }
        catch
        {
            // Best-effort — never bubble up.
        }
    }

    public static async Task NotifyNewProductOrderAsync(SalonDbContext db, ProductOrder order)
    {
        try
        {
            var to = await ResolveOwnerEmailAsync(db);
            if (to is null) return;

            var deepLink = $"{FrontendBase()}/reception/orders?focus=order-{order.Id}";

            var rows = new List<string?>
            {
                Row("Customer", order.CustomerName),
                Row("Phone", order.CustomerPhone),
                string.IsNullOrWhiteSpace(order.CustomerEmail) ? null : Row("Email", order.CustomerEmail!),
                Row("Product", order.ProductName),
                Row("Quantity", order.Quantity.ToString()),
                Row("Total", $"₹{order.TotalAmount:0.##}"),
                string.IsNullOrWhiteSpace(order.DeliveryAddress) ? null : Row("Delivery", order.DeliveryAddress!),
                string.IsNullOrWhiteSpace(order.Notes) ? null : Row("Notes", order.Notes!),
            };

            var html = BuildHtml(
                "A new product order just came in.",
                rows,
                deepLink,
                "Open this order in the reception desk →");

            await EmailSender.SendAsync(to, $"New product order · {order.ProductName}", html);
        }
        catch
        {
            // Best-effort — never bubble up.
        }
    }

    private static string BuildHtml(
        string intro, List<string?> rows, string deepLink, string linkLabel)
    {
        var body = string.Join("\n", rows.Where(r => r is not null));
        return $@"
<p>{System.Net.WebUtility.HtmlEncode(intro)}</p>
<table cellpadding=""6"" style=""border-collapse:collapse;font-size:14px"">
{body}
</table>
<p style=""margin-top:16px""><a href=""{deepLink}"">{System.Net.WebUtility.HtmlEncode(linkLabel)}</a></p>
<p>— Mr. &amp; Mrs. Cuts Salon</p>";
    }

    private static string Row(string label, string value)
    {
        return $@"<tr><td style=""color:#8a8a8a;padding-right:16px"">{System.Net.WebUtility.HtmlEncode(label)}</td><td><strong>{System.Net.WebUtility.HtmlEncode(value)}</strong></td></tr>";
    }
}
