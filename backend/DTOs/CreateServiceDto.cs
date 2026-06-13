namespace backend.DTOs;

public class CreateServiceDto
{
    public string? ServiceName { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? Price { get; set; }
    public bool? IsActive { get; set; }
}
