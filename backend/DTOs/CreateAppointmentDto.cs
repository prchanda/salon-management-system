namespace backend.DTOs;

/// <summary>
/// Create a booking or walk-in. Resolution order:
///   1. <see cref="CustomerId"/> if provided → use that customer.
///   2. <see cref="PhoneNumber"/> if provided → look up; create a new customer
///      using <see cref="FullName"/> if no match.
///   3. Otherwise → anonymous walk-in; <see cref="FullName"/> is stored as
///      the appointment's GuestName for display only (no customer record).
/// </summary>
public class CreateAppointmentDto
{
    public long? CustomerId { get; set; }

    public string? PhoneNumber { get; set; }

    public string? FullName { get; set; }

    public long ServiceId { get; set; }

    public long? StaffId { get; set; }

    public DateOnly AppointmentDate { get; set; }

    public TimeOnly AppointmentTime { get; set; }

    public string? Remarks { get; set; }

    /// <summary>
    /// Honeypot. Hidden on the public form so real users never fill it; bots
    /// that auto-complete every field will. Any non-empty value is treated as
    /// spam and silently rejected.
    /// </summary>
    public string? Website { get; set; }
}
