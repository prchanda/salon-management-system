using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Posts;

public class GetAdminPostById
{
    private readonly SalonDbContext _context;

    public GetAdminPostById(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — fetch a post by id (drafts included), used by the editor.</summary>
    [Function("GetAdminPostById")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "posts/admin/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id);
        if (post is null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(post);
        return response;
    }
}
