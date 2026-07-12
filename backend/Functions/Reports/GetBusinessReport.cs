using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Net;
using System.Web;

namespace backend.Functions.Reports;

/// <summary>
/// Owner-facing business report spanning several months: monthly revenue trend
/// (service + shop), month-over-month growth, a run-rate projection for the
/// current (partial) month, and top services / staff / payment mix over the
/// whole window. Complements the single-day <see cref="GetDaySummary"/>.
/// </summary>
public class GetBusinessReport
{
    private readonly SalonDbContext _context;

    public GetBusinessReport(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetBusinessReport")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "reports/business")]
        HttpRequestData req)
    {
        var query = HttpUtility.ParseQueryString(req.Url.Query);

        // How many months to include, current month inclusive. Clamp to a sane range.
        var months = 6;
        if (int.TryParse(query["months"], out var m))
        {
            months = Math.Clamp(m, 3, 24);
        }

        // The salon operates in India (IST = UTC+5:30). Timestamps are stored in
        // UTC, so we shift into IST wall-clock time before bucketing by month —
        // otherwise an order/customer created just after local midnight lands in
        // the previous month, which wouldn't match the Orders screen. See IstTime.
        DateTime ToIst(DateTime utc) => IstTime.ToIst(utc);

        var today = IstTime.Today;
        var currentMonthStart = new DateOnly(today.Year, today.Month, 1);
        var rangeStart = currentMonthStart.AddMonths(-(months - 1));

        // Fetch from the UTC instant that corresponds to IST midnight on the first
        // day of the window (i.e. the offset earlier than UTC midnight).
        var rangeStartUtc = IstTime.StartOfDayUtc(rangeStart);

        // ── Pull the raw rows once, then aggregate in memory. Volumes for a
        //    single salon over a couple of years are small, so this keeps the
        //    LINQ simple and avoids provider-specific date grouping.
        var appointments = await _context.Appointments
            .AsNoTracking()
            .Include(x => x.Staff)
            .Include(x => x.Service)
            .Where(x => x.AppointmentDate >= rangeStart)
            .ToListAsync();

        var productOrders = await _context.ProductOrders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= rangeStartUtc)
            .ToListAsync();

        var newCustomers = await _context.Customers
            .AsNoTracking()
            .Where(c => c.CreatedAt >= rangeStartUtc)
            .Select(c => c.CreatedAt)
            .ToListAsync();

        var doneAppointments = appointments.Where(a => a.Status == "Done").ToList();
        var completedOrders = productOrders.Where(o => o.Status == "Completed").ToList();

        // ── Build one bucket per calendar month in the window ──────────────
        var monthly = new List<object>();
        for (var i = 0; i < months; i++)
        {
            var monthStart = rangeStart.AddMonths(i);
            var key = $"{monthStart.Year:D4}-{monthStart.Month:D2}";
            var label = monthStart.ToDateTime(TimeOnly.MinValue)
                .ToString("MMM yyyy", CultureInfo.InvariantCulture);

            var svcRevenue = doneAppointments
                .Where(a => a.AppointmentDate.Year == monthStart.Year && a.AppointmentDate.Month == monthStart.Month)
                .Sum(a => a.AmountPaid ?? 0);

            var apptDone = doneAppointments
                .Count(a => a.AppointmentDate.Year == monthStart.Year && a.AppointmentDate.Month == monthStart.Month);

            var prodRevenue = completedOrders
                .Where(o => ToIst(o.CreatedAt).Year == monthStart.Year && ToIst(o.CreatedAt).Month == monthStart.Month)
                .Sum(o => o.AmountPaid ?? o.TotalAmount);

            var ordersDone = completedOrders
                .Count(o => ToIst(o.CreatedAt).Year == monthStart.Year && ToIst(o.CreatedAt).Month == monthStart.Month);

            var newCust = newCustomers
                .Count(c => ToIst(c).Year == monthStart.Year && ToIst(c).Month == monthStart.Month);

            var totalRevenue = svcRevenue + prodRevenue;
            var avgTicket = apptDone > 0 ? Math.Round(svcRevenue / apptDone, 2) : 0m;

            monthly.Add(new
            {
                Month = key,
                Label = label,
                ServiceRevenue = svcRevenue,
                ProductRevenue = prodRevenue,
                TotalRevenue = totalRevenue,
                AppointmentsDone = apptDone,
                OrdersCompleted = ordersDone,
                NewCustomers = newCust,
                AvgTicket = avgTicket,
                IsCurrent = monthStart == currentMonthStart
            });
        }

        // ── Current vs previous month + run-rate projection ───────────────
        decimal CurrentMonthRevenue(int yearOffsetMonths)
        {
            var ms = currentMonthStart.AddMonths(yearOffsetMonths);
            var svc = doneAppointments
                .Where(a => a.AppointmentDate.Year == ms.Year && a.AppointmentDate.Month == ms.Month)
                .Sum(a => a.AmountPaid ?? 0);
            var prod = completedOrders
                .Where(o => ToIst(o.CreatedAt).Year == ms.Year && ToIst(o.CreatedAt).Month == ms.Month)
                .Sum(o => o.AmountPaid ?? o.TotalAmount);
            return svc + prod;
        }

        var currentRevenue = CurrentMonthRevenue(0);
        var prevRevenue = CurrentMonthRevenue(-1);

        decimal? momGrowthPct = prevRevenue > 0
            ? Math.Round((currentRevenue - prevRevenue) / prevRevenue * 100m, 1)
            : (decimal?)null;

        var daysInMonth = DateTime.DaysInMonth(currentMonthStart.Year, currentMonthStart.Month);
        var daysElapsed = today.Day; // today counts as an in-progress day
        decimal projectedRevenue = daysElapsed > 0
            ? Math.Round(currentRevenue / daysElapsed * daysInMonth, 2)
            : currentRevenue;

        // ── Leaderboards over the whole window (Done / Completed only) ─────
        var topStaff = doneAppointments
            .GroupBy(a => new { a.StaffId, StaffName = a.Staff?.FullName ?? "Unassigned" })
            .Select(g => new
            {
                StaffId = g.Key.StaffId,
                StaffName = g.Key.StaffName,
                Done = g.Count(),
                Revenue = g.Sum(x => x.AmountPaid ?? 0)
            })
            .OrderByDescending(x => x.Revenue)
            .Take(8)
            .ToList();

        var topServices = doneAppointments
            .GroupBy(a => new { a.ServiceId, ServiceName = a.Service?.ServiceName ?? "Unknown" })
            .Select(g => new
            {
                ServiceId = (long?)g.Key.ServiceId,
                ServiceName = g.Key.ServiceName,
                Done = g.Count(),
                Revenue = g.Sum(x => x.AmountPaid ?? 0)
            })
            .OrderByDescending(x => x.Revenue)
            .ThenByDescending(x => x.Done)
            .Take(8)
            .ToList();

        var paymentMix = doneAppointments
            .GroupBy(a => string.IsNullOrWhiteSpace(a.PaymentMethod) ? "Unspecified" : a.PaymentMethod!)
            .Select(g => new
            {
                Method = g.Key,
                Count = g.Count(),
                Revenue = g.Sum(x => x.AmountPaid ?? 0)
            })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        var periodServiceRevenue = doneAppointments.Sum(a => a.AmountPaid ?? 0);
        var periodProductRevenue = completedOrders.Sum(o => o.AmountPaid ?? o.TotalAmount);

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            RangeMonths = months,
            RangeStart = rangeStart,
            Months = monthly,
            Current = new
            {
                Month = $"{currentMonthStart.Year:D4}-{currentMonthStart.Month:D2}",
                Label = currentMonthStart.ToDateTime(TimeOnly.MinValue)
                    .ToString("MMM yyyy", CultureInfo.InvariantCulture),
                TotalRevenue = currentRevenue,
                PrevTotalRevenue = prevRevenue,
                MomGrowthPct = momGrowthPct,
                ProjectedTotalRevenue = projectedRevenue,
                DaysElapsed = daysElapsed,
                DaysInMonth = daysInMonth
            },
            Totals = new
            {
                ServiceRevenue = periodServiceRevenue,
                ProductRevenue = periodProductRevenue,
                TotalRevenue = periodServiceRevenue + periodProductRevenue,
                AppointmentsDone = doneAppointments.Count,
                OrdersCompleted = completedOrders.Count,
                NewCustomers = newCustomers.Count
            },
            TopStaff = topStaff,
            TopServices = topServices,
            PaymentMix = paymentMix
        });

        return response;
    }
}
