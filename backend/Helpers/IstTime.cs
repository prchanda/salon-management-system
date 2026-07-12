namespace backend.Helpers;

/// <summary>
/// Helpers for working in India Standard Time. The salon operates in India, but
/// all timestamps are stored in UTC. Reports that group by calendar day/month
/// must therefore convert to IST first — otherwise an order or customer created
/// just after local midnight is counted against the previous day/month (it's
/// still "yesterday" in UTC), which wouldn't match the dates reception sees.
///
/// IST is a fixed UTC+5:30 offset with no daylight saving, so a constant offset
/// is sufficient (and avoids depending on the OS timezone database).
/// </summary>
public static class IstTime
{
    public const int OffsetMinutes = 330; // +05:30

    private static readonly TimeSpan Offset = TimeSpan.FromMinutes(OffsetMinutes);

    /// <summary>The current calendar date in IST.</summary>
    public static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow.Add(Offset));

    /// <summary>Shifts a stored UTC timestamp into IST wall-clock time.</summary>
    public static DateTime ToIst(DateTime utc) => utc.Add(Offset);

    /// <summary>
    /// The UTC instant corresponding to IST midnight at the start of the given
    /// IST date (i.e. the offset earlier than UTC midnight).
    /// </summary>
    public static DateTime StartOfDayUtc(DateOnly istDate) =>
        DateTime.SpecifyKind(istDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc).Subtract(Offset);
}
