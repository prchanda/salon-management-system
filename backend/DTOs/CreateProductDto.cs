namespace backend.DTOs;

public class CreateProductDto
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? ImageUrl { get; set; }
    public int? StockQuantity { get; set; }
    public bool? IsActive { get; set; }
}
