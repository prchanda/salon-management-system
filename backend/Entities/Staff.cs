namespace backend.Entities;

public class Staff
{
    public long Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    // Self-service account credentials. Null until the staff member
    // completes registration.
    public string? Username { get; set; }
    public string? PasswordHash { get; set; }
    public string? PasswordSalt { get; set; }
    public DateTime? RegisteredAt { get; set; }

    // Owner approval gate. Staff cannot log in until IsApproved is true.
    public bool IsApproved { get; set; }
    public DateTime? ApprovedAt { get; set; }

    // Password-reset by emailed link.
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetExpiresAt { get; set; }
}