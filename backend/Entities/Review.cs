namespace backend.Entities;

/// <summary>
/// A customer-submitted review shown in the public rotating testimonials.
/// Reviews are held for moderation on submit (<see cref="IsApproved"/> defaults
/// to false); reception must approve them before they appear publicly.
/// </summary>
public class Review
{
    public long Id { get; set; }

    public string AuthorName { get; set; } = string.Empty;

    public string Quote { get; set; } = string.Empty;

    /// <summary>1–5 stars. Defaults to 5.</summary>
    public int Rating { get; set; } = 5;

    /// <summary>Optional year — e.g. "2022" → rendered as "guest since 2022".</summary>
    public string? GuestSince { get; set; }

    public bool IsApproved { get; set; }

    public DateTime CreatedAt { get; set; }
}
