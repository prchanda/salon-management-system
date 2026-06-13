namespace backend.Entities;

public class Service
{
    public long Id { get; set; }

    public string ServiceName { get; set; } = string.Empty;

    public string? Category { get; set; }

    public string? Description { get; set; }

    public int DurationMinutes { get; set; }

    public decimal Price { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
}