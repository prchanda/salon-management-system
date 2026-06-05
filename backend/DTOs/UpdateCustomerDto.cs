namespace backend.DTOs;

/// <summary>
/// Edits an existing customer's core details from the reception profile page.
/// Phone stays optional (walk-ins may have none) but must be unique when set.
/// </summary>
public class UpdateCustomerDto
{
    public string FullName { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }
}
