using backend.Data;
using backend.Entities;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Posts;

public class GetPosts
{
    private const int DefaultLimit = 50;
    private const int MaxLimit = 200;

    private readonly SalonDbContext _context;

    public GetPosts(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Public — published posts only, newest first.</summary>
    [Function("GetPosts")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "posts")]
        HttpRequestData req)
    {
        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);

        var limit = DefaultLimit;
        if (int.TryParse(query["limit"], out var parsed) && parsed > 0)
        {
            limit = Math.Min(parsed, MaxLimit);
        }

        var tag = query["tag"]?.Trim().ToLowerInvariant();

        IQueryable<Post> q = _context.Posts.Where(p => p.IsPublished);
        if (!string.IsNullOrEmpty(tag))
        {
            q = q.Where(p => p.Tags != null && p.Tags.ToLower().Contains(tag));
        }

        var posts = await q
            .OrderByDescending(p => p.PublishedAt ?? p.CreatedAt)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Slug,
                p.Title,
                p.Excerpt,
                p.CoverImageUrl,
                p.Tags,
                p.PublishedAt,
                p.CreatedAt,
            })
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(posts);
        return response;
    }
}
