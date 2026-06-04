using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Posts;

public class UpdatePost
{
    private const int MaxTitle = 160;
    private const int MaxExcerpt = 400;
    private const int MinBody = 20;

    private readonly SalonDbContext _context;

    public UpdatePost(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdatePost")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "posts/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id);
        if (post is null) return req.CreateResponse(HttpStatusCode.NotFound);

        var dto = await req.ReadFromJsonAsync<UpdatePostDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        if (dto.Title != null)
        {
            var title = dto.Title.Trim();
            if (string.IsNullOrWhiteSpace(title) || title.Length > MaxTitle)
                return await Bad(req, $"title must be 1–{MaxTitle} chars.");

            if (!string.Equals(post.Title, title, StringComparison.Ordinal))
            {
                post.Title = title;
                var baseSlug = SlugHelper.Slugify(title);
                post.Slug = SlugHelper.Unique(
                    baseSlug,
                    s => _context.Posts.Any(p => p.Slug == s && p.Id != post.Id));
            }
        }

        if (dto.Excerpt != null)
        {
            var ex = dto.Excerpt.Trim();
            if (ex.Length > MaxExcerpt) return await Bad(req, $"excerpt too long.");
            post.Excerpt = ex;
        }

        if (dto.Body != null)
        {
            var body = dto.Body.Trim();
            if (body.Length < MinBody) return await Bad(req, $"body must be ≥ {MinBody} chars.");
            post.Body = body;
        }

        if (dto.CoverImageUrl != null)
        {
            post.CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl) ? null : dto.CoverImageUrl.Trim();
        }
        if (dto.Tags != null)
        {
            post.Tags = string.IsNullOrWhiteSpace(dto.Tags) ? null : dto.Tags.Trim();
        }

        if (dto.IsPublished.HasValue && dto.IsPublished.Value != post.IsPublished)
        {
            post.IsPublished = dto.IsPublished.Value;
            if (post.IsPublished && post.PublishedAt is null)
            {
                post.PublishedAt = DateTime.UtcNow;
            }
        }

        post.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(post);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
