namespace backend.DTOs;

/// <summary>
/// Closes an appointment with payment details. Status defaults to "Done";
/// pass "NoShow" or "Cancelled" to close without payment.
/// </summary>
public class MarkAppointmentDoneDto
{
    public string Status { get; set; } = "Done";

    public decimal? AmountPaid { get; set; }

    public string? PaymentMethod { get; set; }
}
