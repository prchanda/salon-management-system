using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Reviews;

public class DeleteReview
{
    private readonly SalonDbContext _context;

    public DeleteReview(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — remove a review (rejects spam or takes down a published one).</summary>
    [Function("DeleteReview")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "reviews/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);
        if (review is null) return req.CreateResponse(HttpStatusCode.NotFound);

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return req.CreateResponse(HttpStatusCode.NoContent);
    }
}
