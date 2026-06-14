using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Reviews;

public class GetReviews
{
    private const int DefaultLimit = 50;
    private const int MaxLimit = 200;

    private readonly SalonDbContext _context;

    public GetReviews(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetReviews")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "reviews")]
        HttpRequestData req)
    {
        var limit = DefaultLimit;
        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        if (int.TryParse(query["limit"], out var parsed) && parsed > 0)
        {
            limit = Math.Min(parsed, MaxLimit);
        }

        var reviews = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Take(limit)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(reviews);
        return response;
    }
}
