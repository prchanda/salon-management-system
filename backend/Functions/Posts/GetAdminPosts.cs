using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Posts;

public class GetAdminPosts
{
    private readonly SalonDbContext _context;

    public GetAdminPosts(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — all posts including drafts.</summary>
    [Function("GetAdminPosts")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "posts/admin/list")]
        HttpRequestData req)
    {
        var posts = await _context.Posts
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new
            {
                p.Id,
                p.Slug,
                p.Title,
                p.Excerpt,
                p.CoverImageUrl,
                p.Tags,
                p.IsPublished,
                p.PublishedAt,
                p.CreatedAt,
                p.UpdatedAt,
            })
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(posts);
        return response;
    }
}
