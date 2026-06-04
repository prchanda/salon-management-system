namespace backend.Entities;

/// <summary>
/// A customer-submitted review shown in the public rotating testimonials.
/// Reviews are auto-approved on submit; <see cref="IsApproved"/> exists so
/// staff can hide spam/inappropriate entries later (toggle in DB).
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

    public bool IsApproved { get; set; } = true;

    public DateTime CreatedAt { get; set; }
}
