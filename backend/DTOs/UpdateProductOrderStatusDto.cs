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

    /// <summary>
    /// Optional. The amount actually collected when completing the order. Lets
    /// reception sell at a discounted price. Defaults to the order total when omitted.
    /// </summary>
    public decimal? AmountPaid { get; set; }

    /// <summary>Optional. Payment method captured when completing (UPI | Cash | Card | Other).</summary>
    public string? PaymentMethod { get; set; }
}
