namespace backend.DTOs;

public class UpdateProductDto
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? ImageUrl { get; set; }
    public int? StockQuantity { get; set; }
    public bool? IsActive { get; set; }
    /// <summary>Pass true to clear an inventory count back to "untracked".</summary>
    public bool? ClearStock { get; set; }
}
