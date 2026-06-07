using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Reviews;

public class ApproveReview
{
    private readonly SalonDbContext _context;

    public ApproveReview(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — publish a pending review.</summary>
    [Function("ApproveReview")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "reviews/{id:long}/approve")]
        HttpRequestData req,
        long id)
    {
        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);
        if (review is null) return req.CreateResponse(HttpStatusCode.NotFound);

        if (!review.IsApproved)
        {
            review.IsApproved = true;
            await _context.SaveChangesAsync();
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(review);
        return response;
    }
}
