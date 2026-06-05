namespace backend.Entities;

public class Staff
{
    public long Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public bool IsActive { get; set; } = true;

    // Marks the single salon-owner account. The owner is a normal Staff row
    // (so she can be scheduled and booked like any specialist) but logs in
    // with elevated reception permissions.
    public bool IsOwner { get; set; }

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

    // Forces a password change on next sign-in. Set when the owner creates
    // the account with a temporary password; cleared once the staff member
    // chooses their own password.
    public bool MustChangePassword { get; set; }

    // Password-reset by emailed link.
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetExpiresAt { get; set; }
}