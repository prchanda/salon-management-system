namespace backend.Entities;

/// <summary>
/// A salon-authored blog post (treatment tips, service spotlights, etc.).
/// Body is stored as Markdown in a Postgres text column — cheap & queryable.
/// </summary>
public class Post
{
    public long Id { get; set; }

    /// <summary>URL-friendly identifier derived from the title. Unique.</summary>
    public string Slug { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    /// <summary>Short teaser shown on the listing page.</summary>
    public string Excerpt { get; set; } = string.Empty;

    /// <summary>Full post body in Markdown.</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Optional cover image URL. Hosted on Supabase Storage (public bucket "blog")
    /// or any external CDN — we only persist the URL string here.
    /// </summary>
    public string? CoverImageUrl { get; set; }

    /// <summary>Optional comma-separated tags, e.g. "hair,skin,tips".</summary>
    public string? Tags { get; set; }

    public bool IsPublished { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
