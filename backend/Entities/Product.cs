namespace backend.Entities;

/// <summary>
/// A retail product the salon sells in-store and online (skin care, hair
/// care, styling, etc.). Owners list these from the reception panel and
/// customers browse the catalogue on the public landing page.
/// </summary>
public class Product
{
    public long Id { get; set; }

    /// <summary>
    /// URL-friendly identifier derived from the name (e.g. "argan-oil-serum").
    /// Unique. Used in the public catalogue URL (/shop/{slug}) for SEO and
    /// shareability. Regenerated automatically when the name changes.
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    /// <summary>Optional category label, e.g. "Skin", "Hair", "Styling".</summary>
    public string? Category { get; set; }

    /// <summary>Short teaser shown on the catalogue grid.</summary>
    public string? ShortDescription { get; set; }

    /// <summary>Full product description (Markdown allowed).</summary>
    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    /// <summary>
    /// Optional image URL. Hosted on Supabase Storage (public bucket "products")
    /// or any external CDN — we only persist the URL string here.
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Optional inventory count. Null means stock is not tracked (product is
    /// always available while IsActive). Zero means out of stock.
    /// </summary>
    public int? StockQuantity { get; set; }

    /// <summary>Hide from the public catalogue without deleting the row.</summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
