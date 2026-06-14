namespace backend.Entities;

/// <summary>
/// Per-viewer notification read state, so the reception bell stays in sync
/// across every device that staff member (or the owner) signs in from. One
/// row per <see cref="Staff"/> id: the last time they marked the bell as seen
/// and the ids they have dismissed.
/// </summary>
public class NotificationState
{
    public long Id { get; set; }

    /// <summary>The viewing user's <see cref="Staff"/> id (owner included).</summary>
    public long StaffId { get; set; }

    /// <summary>Newest moment the user has acknowledged the bell.</summary>
    public DateTime? LastSeenAt { get; set; }

    /// <summary>JSON array of dismissed event ids (e.g. ["booking-54"]).</summary>
    public string DismissedIdsJson { get; set; } = "[]";

    public DateTime UpdatedAt { get; set; }
}
