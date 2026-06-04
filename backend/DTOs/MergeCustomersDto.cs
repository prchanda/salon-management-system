namespace backend.DTOs;

/// <summary>
/// Merges a duplicate customer into a target customer. All appointments owned
/// by <see cref="SourceCustomerId"/> are reassigned to the target, missing
/// contact fields on the target are back-filled from the source, and the
/// source customer record is then deleted.
/// </summary>
public class MergeCustomersDto
{
    /// <summary>The duplicate customer to merge in and delete.</summary>
    public long SourceCustomerId { get; set; }
}
