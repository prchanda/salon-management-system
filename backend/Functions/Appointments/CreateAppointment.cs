using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.RegularExpressions;

namespace backend.Functions.Appointments;

/// <summary>
/// Reception/public endpoint. Creates an appointment for an existing customer,
/// a new customer (if a phone is given), or an anonymous walk-in (no phone at
/// all). Because the route is anonymous and public-facing, it also enforces
/// basic anti-spam protections: a honeypot field, input validation, a per-IP
/// rate limit, and a cap on active future bookings per phone number.
/// </summary>
public class CreateAppointment
{
    // Anti-spam thresholds.
    private const int MaxBookingsPerIpPerWindow = 12;
    private static readonly TimeSpan IpWindow = TimeSpan.FromMinutes(10);
    private const int MaxActiveFutureBookingsPerPhone = 5;

    // Field caps / formats (mirrors the client-side checks; enforced again here
    // because client validation can be bypassed).
    private const int MaxNameLength = 80;
    private const int MaxRemarksLength = 500;
    private const int MaxBookingDaysAhead = 180;
    private static readonly Regex PhonePattern = new(@"^[0-9+\-\s]{7,15}$", RegexOptions.Compiled);

    private readonly SalonDbContext _context;

    public CreateAppointment(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CreateAppointment")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "appointments")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<CreateAppointmentDto>();

        if (dto == null)
        {
            return req.CreateResponse(HttpStatusCode.BadRequest);
        }

        // 1. Honeypot. Real users can't see this field; only bots fill it.
        // Pretend success so the bot doesn't learn it was filtered.
        if (!string.IsNullOrWhiteSpace(dto.Website))
        {
            var trap = req.CreateResponse(HttpStatusCode.Created);
            await trap.WriteAsJsonAsync(new { Appointment = (object?)null, Customer = (object?)null });
            return trap;
        }

        // 2. Per-IP rate limit (best-effort; skipped when no IP is available,
        // e.g. some local runs).
        var ip = GetClientIp(req);
        if (ip != null &&
            !RateLimiter.IsAllowed($"booking:ip:{ip}", MaxBookingsPerIpPerWindow, IpWindow))
        {
            var limited = req.CreateResponse(HttpStatusCode.TooManyRequests);
            await limited.WriteStringAsync("Too many booking attempts. Please try again later.");
            return limited;
        }

        var phone = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber!.Trim();
        var name = string.IsNullOrWhiteSpace(dto.FullName) ? null : dto.FullName!.Trim();

        // 3. Input validation.
        if (phone != null && !PhonePattern.IsMatch(phone))
        {
            return await BadRequest(req, "Please provide a valid phone number.");
        }

        if (name != null && name.Length > MaxNameLength)
        {
            return await BadRequest(req, "Name is too long.");
        }

        var remarks = string.IsNullOrWhiteSpace(dto.Remarks) ? null : dto.Remarks!.Trim();
        if (remarks != null && remarks.Length > MaxRemarksLength)
        {
            return await BadRequest(req, "Notes are too long.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        // Allow a one-day backstop for timezone differences (salon is in IST).
        if (dto.AppointmentDate < today.AddDays(-1) ||
            dto.AppointmentDate > today.AddDays(MaxBookingDaysAhead))
        {
            return await BadRequest(req, "Please choose a valid appointment date.");
        }

        var serviceExists = await _context.Services
            .AnyAsync(x => x.Id == dto.ServiceId && x.IsActive);

        if (!serviceExists)
        {
            return await BadRequest(req, "The selected service is unavailable.");
        }

        if (dto.StaffId.HasValue)
        {
            var staffExists = await _context.Staff
                .AnyAsync(x => x.Id == dto.StaffId.Value && x.IsActive);

            if (!staffExists)
            {
                return await BadRequest(req, "The selected specialist is unavailable.");
            }
        }

        Customer? customer = null;
        string? guestName = null;

        if (dto.CustomerId.HasValue)
        {
            customer = await _context.Customers
                .FirstOrDefaultAsync(x => x.Id == dto.CustomerId.Value);

            if (customer == null)
            {
                var notFound = req.CreateResponse(HttpStatusCode.NotFound);
                await notFound.WriteStringAsync("Customer not found.");
                return notFound;
            }
        }
        else if (phone != null)
        {
            customer = await _context.Customers
                .FirstOrDefaultAsync(x => x.PhoneNumber == phone);

            if (customer == null)
            {
                customer = new Customer
                {
                    FullName = name ?? "Guest",
                    PhoneNumber = phone,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Customers.Add(customer);

                await _context.SaveChangesAsync();
            }
        }
        else
        {
            // Anonymous walk-in: keep a friendly label for the day view.
            guestName = name ?? "Walk-in";
        }

        // 4. Per-phone cap: limit how many active future bookings a single
        // customer can stack up, so one number can't flood the schedule.
        if (customer != null)
        {
            var activeFuture = await _context.Appointments
                .CountAsync(x => x.CustomerId == customer.Id
                    && x.Status == "Booked"
                    && x.AppointmentDate >= today);

            if (activeFuture >= MaxActiveFutureBookingsPerPhone)
            {
                var limited = req.CreateResponse(HttpStatusCode.TooManyRequests);
                await limited.WriteStringAsync(
                    "You already have several upcoming bookings. Please call us to add more.");
                return limited;
            }
        }

        var appointment = new Appointment
        {
            CustomerId = customer?.Id,
            GuestName = guestName,
            StaffId = dto.StaffId,
            ServiceId = dto.ServiceId,
            AppointmentDate = dto.AppointmentDate,
            AppointmentTime = dto.AppointmentTime,
            Remarks = remarks,
            Status = "Booked",
            CreatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.Created);

        await response.WriteAsJsonAsync(new
        {
            Appointment = appointment,
            Customer = customer
        });

        return response;
    }

    private static async Task<HttpResponseData> BadRequest(HttpRequestData req, string message)
    {
        var bad = req.CreateResponse(HttpStatusCode.BadRequest);
        await bad.WriteStringAsync(message);
        return bad;
    }

    /// <summary>
    /// Best-effort client IP from the X-Forwarded-For header (first hop).
    /// Returns null when unavailable so IP throttling is simply skipped.
    /// </summary>
    private static string? GetClientIp(HttpRequestData req)
    {
        if (req.Headers.TryGetValues("X-Forwarded-For", out var values))
        {
            var first = values.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first))
            {
                var candidate = first.Split(',')[0].Trim();
                if (!string.IsNullOrWhiteSpace(candidate))
                {
                    return candidate;
                }
            }
        }

        return null;
    }
}