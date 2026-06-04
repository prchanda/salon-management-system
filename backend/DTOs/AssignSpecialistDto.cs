namespace backend.DTOs;

/// <summary>
/// Assign (or clear) the specialist on an existing appointment.
/// Used by the reception "assign later" flow.
/// </summary>
public class AssignSpecialistDto
{
    /// <summary>
    /// Target staff id. Null clears the assignment ("assign later").
    /// </summary>
    public long? StaffId { get; set; }
}
