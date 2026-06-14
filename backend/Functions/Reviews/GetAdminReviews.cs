using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Reviews;

public class GetAdminReviews
{
    private readonly SalonDbContext _context;

    public GetAdminReviews(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Reception — all reviews including those awaiting moderation. Pending
    /// (unapproved) reviews are surfaced first so they can be actioned.
    /// </summary>
    [Function("GetAdminReviews")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "reviews/admin/list")]
        HttpRequestData req)
    {
        var reviews = await _context.Reviews
            .AsNoTracking()
            .OrderBy(r => r.IsApproved)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(reviews);
        return response;
    }
}
