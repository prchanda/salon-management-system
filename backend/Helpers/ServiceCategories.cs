namespace backend.Helpers;

/// <summary>
/// Canonical service categories. The public services page groups the menu by
/// these. Keep in sync with frontend/lib/serviceCategories.ts.
/// </summary>
public static class ServiceCategories
{
    public const string Default = "Add-ons";

    public static readonly string[] All =
    {
        "Hair",
        "Skin",
        "Nails",
        "Spa",
        "Add-ons",
    };

    /// <summary>
    /// Returns the matching canonical category (case-insensitive) or null when
    /// the value isn't one of the known categories.
    /// </summary>
    public static string? TryNormalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return All.FirstOrDefault(c =>
            string.Equals(c, trimmed, StringComparison.OrdinalIgnoreCase));
    }
}
