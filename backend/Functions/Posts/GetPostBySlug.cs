using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Posts;

public class GetPostBySlug
{
    private readonly SalonDbContext _context;

    public GetPostBySlug(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Public — single published post by slug.</summary>
    [Function("GetPostBySlug")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "posts/{slug}")]
        HttpRequestData req,
        string slug)
    {
        var post = await _context.Posts
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished);

        if (post is null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(post);
        return response;
    }
}
