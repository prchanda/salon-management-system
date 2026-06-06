namespace backend.Entities;

/// <summary>
/// A customer-placed retail order for a single product. Captures a snapshot of
/// the product name and unit price at order time so reception can still see
/// what was sold even if the catalogue entry is later edited or removed.
/// </summary>
public class ProductOrder
{
    public long Id { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string? CustomerEmail { get; set; }

    public string? DeliveryAddress { get; set; }

    public string? Notes { get; set; }

    /// <summary>FK to Product. Nullable so historical orders survive product deletion.</summary>
    public long? ProductId { get; set; }

    public Product? Product { get; set; }

    /// <summary>Snapshot of the product name at order time.</summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>Snapshot of the unit price at order time.</summary>
    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal TotalAmount { get; set; }

    /// <summary>Pending | Confirmed | Completed | Cancelled.</summary>
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
