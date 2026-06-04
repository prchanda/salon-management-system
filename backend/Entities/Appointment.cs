namespace backend.Entities;

public class Appointment
{
    public long Id { get; set; }

    /// <summary>
    /// Optional. Null for anonymous walk-ins; can be back-filled later via
    /// the attach-customer endpoint.
    /// </summary>
    public long? CustomerId { get; set; }

    /// <summary>
    /// Used when <see cref="CustomerId"/> is null so reception can still show
    /// a friendly label on the day view (e.g. "Walk-in", first name only).
    /// </summary>
    public string? GuestName { get; set; }

    public long? StaffId { get; set; }

    public long ServiceId { get; set; }

    public DateOnly AppointmentDate { get; set; }

    public TimeOnly AppointmentTime { get; set; }

    /// <summary>
    /// Lifecycle: Booked -> Done | NoShow | Cancelled.
    /// </summary>
    public string Status { get; set; } = "Booked";

    public string? Remarks { get; set; }

    public decimal? AmountPaid { get; set; }

    public string? PaymentMethod { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public Customer? Customer { get; set; }

    public Staff? Staff { get; set; }

    public Service? Service { get; set; }
}