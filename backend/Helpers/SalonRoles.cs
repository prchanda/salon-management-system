namespace backend.Helpers;

/// <summary>
/// Canonical catalogue of staff job roles for the salon. Roles are selected
/// from this fixed list (rather than typed freely) so the data stays clean.
/// A staff member may hold several roles; they are persisted in the existing
/// Staff.Role column as a comma-separated string.
/// </summary>
public static class SalonRoles
{
    /// <summary>The allowed roles, in display order.</summary>
    public static readonly IReadOnlyList<string> All = new[]
    {
        "Hair Stylist",
        "Barber",
        "Colorist",
        "Beautician",
        "Makeup Artist",
        "Nail Artist",
        "Pedicurist",
        "Esthetician",
        "Massage Therapist",
        "Spa Therapist",
    };

    /// <summary>
    /// Validates and normalises a set of incoming role names against the
    /// catalogue. Matching is case-insensitive and the canonical casing is
    /// returned. Duplicates are removed while preserving catalogue order.
    /// </summary>
    /// <returns>true on success; on failure, <paramref name="error"/> is set.</returns>
    public static bool TryNormalize(
        IEnumerable<string>? input,
        out List<string> canonical,
        out string? error)
    {
        canonical = new List<string>();
        error = null;

        var requested = (input ?? Enumerable.Empty<string>())
            .Select(r => (r ?? string.Empty).Trim())
            .Where(r => r.Length > 0)
            .ToList();

        if (requested.Count == 0)
        {
            error = "Please select at least one role.";
            return false;
        }

        var lookup = All.ToDictionary(r => r.ToLowerInvariant(), r => r);
        var seen = new HashSet<string>();

        foreach (var role in requested)
        {
            if (!lookup.TryGetValue(role.ToLowerInvariant(), out var match))
            {
                error = $"\"{role}\" is not a recognised role.";
                return false;
            }
            seen.Add(match);
        }

        // Return in catalogue order for a stable, tidy display string.
        canonical = All.Where(r => seen.Contains(r)).ToList();
        return true;
    }

    /// <summary>Joins canonical roles into the stored representation.</summary>
    public static string Join(IEnumerable<string> roles) => string.Join(", ", roles);

    /// <summary>Splits a stored role string back into individual roles.</summary>
    public static List<string> Split(string? stored) =>
        (stored ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
}
