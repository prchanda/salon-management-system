using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Posts;

public class CreatePost
{
    private const int MaxTitle = 160;
    private const int MaxExcerpt = 400;
    private const int MinBody = 20;

    private readonly SalonDbContext _context;

    public CreatePost(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CreatePost")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "posts")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<CreatePostDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        var title = (dto.Title ?? string.Empty).Trim();
        var excerpt = (dto.Excerpt ?? string.Empty).Trim();
        var body = (dto.Body ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(title) || title.Length > MaxTitle)
            return await Bad(req, $"title is required (max {MaxTitle} chars).");
        if (excerpt.Length > MaxExcerpt)
            return await Bad(req, $"excerpt must be {MaxExcerpt} chars or fewer.");
        if (body.Length < MinBody)
            return await Bad(req, $"body must be at least {MinBody} characters.");

        var baseSlug = SlugHelper.Slugify(title);
        var slug = SlugHelper.Unique(baseSlug, s => _context.Posts.Any(p => p.Slug == s));

        var now = DateTime.UtcNow;
        var publish = dto.Publish == true;

        var post = new Post
        {
            Slug = slug,
            Title = title,
            Excerpt = excerpt,
            Body = body,
            CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl) ? null : dto.CoverImageUrl!.Trim(),
            Tags = string.IsNullOrWhiteSpace(dto.Tags) ? null : dto.Tags!.Trim(),
            IsPublished = publish,
            PublishedAt = publish ? now : null,
            CreatedAt = now,
            UpdatedAt = now,
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.Created);
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
