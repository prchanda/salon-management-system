using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Web;

namespace backend.Functions.Customers;

public class GetCustomers
{
    // Cap how many rows a single request can pull so the list never loads the
    // entire (and ever-growing) customer table into memory.
    private const int DefaultLimit = 100;
    private const int MaxLimit = 200;

    private readonly SalonDbContext _context;

    public GetCustomers(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetCustomers")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "customers")]
        HttpRequestData req)
    {
        var query = HttpUtility.ParseQueryString(req.Url.Query);
        var search = query["q"]?.Trim();
        var limit = int.TryParse(query["limit"], out var l)
            ? Math.Clamp(l, 1, MaxLimit)
            : DefaultLimit;

        IQueryable<Entities.Customer> customersQuery = _context.Customers.AsNoTracking();

        if (!string.IsNullOrEmpty(search))
        {
            // Case-insensitive match on name OR phone, filtered in the database.
            var pattern = $"%{search}%";
            customersQuery = customersQuery.Where(c =>
                EF.Functions.ILike(c.FullName, pattern) ||
                (c.PhoneNumber != null && EF.Functions.ILike(c.PhoneNumber, pattern)));
        }

        var customers = await customersQuery
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(customers);

        return response;
    }
}