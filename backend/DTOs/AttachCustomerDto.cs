namespace backend.DTOs;

/// <summary>
/// Back-fills a customer link on an existing appointment. Used by the
/// "claim later" flow when the guest didn't share their phone at check-in.
/// If a customer with this phone exists, the appointment is linked to them;
/// otherwise a new customer is created.
/// </summary>
public class AttachCustomerDto
{
    public string PhoneNumber { get; set; } = string.Empty;

    public string? FullName { get; set; }
}
