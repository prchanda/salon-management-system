namespace backend.Entities;

public class Customer
{
    public long Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Optional. A guest may visit without sharing a number; phone can be
    /// attached later via the "claim later" flow. Unique when present.
    /// </summary>
    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
}