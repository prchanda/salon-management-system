namespace backend.DTOs;

/// <summary>
/// Owner-supplied payload to upsert the singleton announcement bar. All fields
/// replace the stored values wholesale (this is a singleton editor, not a
/// partial patch), except that blank optional fields are normalised to null.
/// </summary>
public class UpdateAnnouncementDto
{
    public string? Message { get; set; }

    public string? CtaLabel { get; set; }

    public string? CtaHref { get; set; }

    public string? Theme { get; set; }

    public bool IsActive { get; set; }

    public DateTime? StartsAt { get; set; }

    public DateTime? EndsAt { get; set; }
}
