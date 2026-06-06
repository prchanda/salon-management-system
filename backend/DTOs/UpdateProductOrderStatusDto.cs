namespace backend.DTOs;

public class UpdateProductOrderStatusDto
{
    /// <summary>
    /// Preferred. Lifecycle action: <c>confirm</c> | <c>complete</c> | <c>cancel</c>.
    /// The server validates that the action is legal from the order's current status.
    /// </summary>
    public string? Action { get; set; }

    /// <summary>
    /// Legacy. A target status string (Pending | Confirmed | Completed | Cancelled).
    /// Still accepted, but the server only honours it if the implied transition
    /// is valid from the current status.
    /// </summary>
    public string? Status { get; set; }
}
