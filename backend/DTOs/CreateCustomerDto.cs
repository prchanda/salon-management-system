namespace backend.DTOs;

public class CreateCustomerDto
{
    public string FullName { get; set; } = string.Empty;

    /// <summary>Optional. Must be unique when present.</summary>
    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }
}
