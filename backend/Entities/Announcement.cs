namespace backend.Entities;

/// <summary>
/// A site-wide announcement / promo bar (e.g. a flash-sale notice). The table
/// keeps a history of announcements; the owner creates new ones and edits the
/// current (non-expired) one from the reception console. The public site shows
/// the most recent bar that is <see cref="IsActive"/> and whose current time
/// falls within the optional <see cref="StartsAt"/>–<see cref="EndsAt"/> window.
/// </summary>
public class Announcement
{
    public long Id { get; set; }

    /// <summary>The headline text shown in the bar.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Optional call-to-action button label (e.g. "Book now").</summary>
    public string? CtaLabel { get; set; }

    /// <summary>Optional call-to-action link (relative path or absolute URL).</summary>
    public string? CtaHref { get; set; }

    /// <summary>
    /// Colour theme key the frontend maps to a palette: "gold", "ink", or
    /// "blush". Kept as a string so adding a theme needs no migration.
    /// </summary>
    public string Theme { get; set; } = "gold";

    /// <summary>Owner master on/off switch.</summary>
    public bool IsActive { get; set; }

    /// <summary>Optional UTC time before which the bar stays hidden.</summary>
    public DateTime? StartsAt { get; set; }

    /// <summary>Optional UTC time after which the bar auto-hides.</summary>
    public DateTime? EndsAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
