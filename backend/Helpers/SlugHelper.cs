using System.Globalization;
using System.Text;

namespace backend.Helpers;

/// <summary>
/// Generates URL-friendly slugs from arbitrary titles, with collision suffixing.
/// </summary>
public static class SlugHelper
{
    public static string Slugify(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        var normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);

        foreach (var c in normalized)
        {
            var cat = CharUnicodeInfo.GetUnicodeCategory(c);
            if (cat == UnicodeCategory.NonSpacingMark) continue;

            if (char.IsLetterOrDigit(c))
            {
                sb.Append(char.ToLowerInvariant(c));
            }
            else if (char.IsWhiteSpace(c) || c == '-' || c == '_')
            {
                sb.Append('-');
            }
        }

        var slug = sb.ToString();
        while (slug.Contains("--")) slug = slug.Replace("--", "-");
        slug = slug.Trim('-');

        if (slug.Length > 80) slug = slug[..80].Trim('-');
        return slug.Length == 0 ? "post" : slug;
    }

    /// <summary>Adds -2, -3, … suffixes until <paramref name="exists"/> returns false.</summary>
    public static string Unique(string baseSlug, Func<string, bool> exists)
    {
        if (!exists(baseSlug)) return baseSlug;
        var i = 2;
        while (exists($"{baseSlug}-{i}")) i++;
        return $"{baseSlug}-{i}";
    }
}
