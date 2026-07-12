using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Web;

namespace backend.Functions.Reports;

/// <summary>
/// Day-end summary for owners: appointments by status, revenue, new customers,
/// and a per-staff breakdown.
/// </summary>
public class GetDaySummary
{
    private readonly SalonDbContext _context;

    public GetDaySummary(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetDaySummary")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "reports/day-summary")]
        HttpRequestData req)
    {
        var query = HttpUtility.ParseQueryString(req.Url.Query);

        var dateRaw = query["date"];

        var date = !string.IsNullOrWhiteSpace(dateRaw) && DateOnly.TryParse(dateRaw, out var parsed)
            ? parsed
            : IstTime.Today;

        var appointments = await _context.Appointments
            .AsNoTracking()
            .Include(x => x.Staff)
            .Include(x => x.Service)
            .Where(x => x.AppointmentDate == date)
            .ToListAsync();

        // Product orders / new customers are stored in UTC, so the "day" window
        // is the IST day translated to its UTC bounds (start inclusive, next-day
        // start exclusive).
        var dayStartUtc = IstTime.StartOfDayUtc(date);
        var dayEndUtc = IstTime.StartOfDayUtc(date.AddDays(1));

        var newCustomers = await _context.Customers
            .CountAsync(c => c.CreatedAt >= dayStartUtc && c.CreatedAt < dayEndUtc);

        var byStaff = appointments
            .GroupBy(a => new { a.StaffId, StaffName = a.Staff?.FullName ?? "Unassigned" })
            .Select(g => new
            {
                StaffId = g.Key.StaffId,
                StaffName = g.Key.StaffName,
                Total = g.Count(),
                Done = g.Count(x => x.Status == "Done"),
                Revenue = g.Where(x => x.Status == "Done").Sum(x => x.AmountPaid ?? 0)
            })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        var byService = appointments
            .GroupBy(a => new { a.ServiceId, ServiceName = a.Service?.ServiceName ?? "Unknown" })
            .Select(g => new
            {
                ServiceId = (long?)g.Key.ServiceId,
                ServiceName = g.Key.ServiceName,
                Total = g.Count(),
                Done = g.Count(x => x.Status == "Done"),
                Revenue = g.Where(x => x.Status == "Done").Sum(x => x.AmountPaid ?? 0)
            })
            .OrderByDescending(x => x.Revenue)
            .ThenByDescending(x => x.Total)
            .ToList();

        var byPaymentMethod = appointments
            .Where(x => x.Status == "Done")
            .GroupBy(a => string.IsNullOrWhiteSpace(a.PaymentMethod) ? "Unspecified" : a.PaymentMethod!)
            .Select(g => new
            {
                Method = g.Key,
                Count = g.Count(),
                Revenue = g.Sum(x => x.AmountPaid ?? 0)
            })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        var doneCount = appointments.Count(x => x.Status == "Done");
        var revenue = appointments.Where(x => x.Status == "Done").Sum(x => x.AmountPaid ?? 0);
        var avgTicket = doneCount > 0 ? Math.Round(revenue / doneCount, 2) : 0m;

        // Shop / product orders placed on this date (IST window mirrors customer count).
        var productOrders = await _context.ProductOrders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= dayStartUtc && o.CreatedAt < dayEndUtc)
            .ToListAsync();

        var completedOrders = productOrders.Where(o => o.Status == "Completed").ToList();
        var productRevenue = completedOrders.Sum(o => o.AmountPaid ?? o.TotalAmount);
        var productUnitsSold = completedOrders.Sum(o => o.Quantity);

        var byProduct = completedOrders
            .GroupBy(o => new { o.ProductId, o.ProductName })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                Orders = g.Count(),
                Units = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.AmountPaid ?? x.TotalAmount)
            })
            .OrderByDescending(x => x.Revenue)
            .ThenByDescending(x => x.Units)
            .ToList();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            Date = date,
            Totals = new
            {
                Appointments = appointments.Count,
                Booked = appointments.Count(x => x.Status == "Booked"),
                Done = doneCount,
                NoShow = appointments.Count(x => x.Status == "NoShow"),
                Cancelled = appointments.Count(x => x.Status == "Cancelled"),
                Revenue = revenue,
                AvgTicket = avgTicket,
                NewCustomers = newCustomers,
                ProductOrdersPlaced = productOrders.Count,
                ProductOrdersCompleted = completedOrders.Count,
                ProductOrdersPending = productOrders.Count(o => o.Status == "Pending" || o.Status == "Confirmed"),
                ProductOrdersCancelled = productOrders.Count(o => o.Status == "Cancelled"),
                ProductRevenue = productRevenue,
                ProductUnitsSold = productUnitsSold,
                TotalRevenue = revenue + productRevenue
            },
            ByStaff = byStaff,
            ByService = byService,
            ByPaymentMethod = byPaymentMethod,
            ByProduct = byProduct
        });

        return response;
    }
}
