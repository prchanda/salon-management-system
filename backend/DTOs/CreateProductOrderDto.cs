namespace backend.DTOs;

public class CreateProductOrderDto
{
    public long? ProductId { get; set; }
    public int? Quantity { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Notes { get; set; }
    /// <summary>Honeypot anti-spam field — left empty by real users.</summary>
    public string? Website { get; set; }
}
