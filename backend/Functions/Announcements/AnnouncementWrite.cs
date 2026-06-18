using backend.DTOs;
using backend.Entities;

namespace backend.Functions.Announcements;

/// <summary>
/// Shared validation + apply logic for creating and updating announcement bars.
/// Both write paths replace every field wholesale from the supplied DTO.
/// </summary>
internal static class AnnouncementWrite
{
    public const int MaxMessage = 200;
    public const int MaxCtaLabel = 40;
    public const int MaxCtaHref = 500;

    private static readonly HashSet<string> AllowedThemes =
        new(StringComparer.OrdinalIgnoreCase) { "gold", "ink", "blush" };

    /// <summary>
    /// Validates the payload. Returns an error message string when invalid, or
    /// <c>null</c> when the DTO is acceptable.
    /// </summary>
    public static string? Validate(UpdateAnnouncementDto dto)
    {
        var message = (dto.Message ?? "").Trim();
        if (string.IsNullOrWhiteSpace(message) || message.Length > MaxMessage)
            return $"message must be 1–{MaxMessage} characters.";

        var theme = (dto.Theme ?? "gold").Trim().ToLowerInvariant();
        if (!AllowedThemes.Contains(theme))
            return $"theme must be one of: {string.Join(", ", AllowedThemes)}.";

        var ctaLabel = (dto.CtaLabel ?? "").Trim();
        if (ctaLabel.Length > MaxCtaLabel)
            return $"ctaLabel must be {MaxCtaLabel} characters or fewer.";

        var ctaHref = (dto.CtaHref ?? "").Trim();
        if (ctaHref.Length > MaxCtaHref)
            return $"ctaHref must be {MaxCtaHref} characters or fewer.";

        // A link must be a same-site path or an http(s) URL — never javascript:
        // or other schemes that could run in the visitor's browser.
        if (ctaHref.Length > 0 && !IsSafeHref(ctaHref))
            return "ctaHref must start with / or http:// or https://.";

        // A button needs both a label and a link, or neither.
        if ((ctaLabel.Length > 0) != (ctaHref.Length > 0))
            return "Provide both a button label and link, or leave both blank.";

        if (dto.StartsAt.HasValue && dto.EndsAt.HasValue
            && dto.EndsAt.Value <= dto.StartsAt.Value)
            return "The end time must be after the start time.";

        return null;
    }

    /// <summary>
    /// Copies the validated DTO onto the entity and stamps <see cref="Announcement.UpdatedAt"/>.
    /// </summary>
    public static void Apply(Announcement announcement, UpdateAnnouncementDto dto)
    {
        var message = (dto.Message ?? "").Trim();
        var theme = (dto.Theme ?? "gold").Trim().ToLowerInvariant();
        var ctaLabel = (dto.CtaLabel ?? "").Trim();
        var ctaHref = (dto.CtaHref ?? "").Trim();

        announcement.Message = message;
        announcement.CtaLabel = ctaLabel.Length > 0 ? ctaLabel : null;
        announcement.CtaHref = ctaHref.Length > 0 ? ctaHref : null;
        announcement.Theme = theme;
        announcement.IsActive = dto.IsActive;
        announcement.StartsAt = dto.StartsAt.HasValue
            ? DateTime.SpecifyKind(dto.StartsAt.Value, DateTimeKind.Utc)
            : null;
        announcement.EndsAt = dto.EndsAt.HasValue
            ? DateTime.SpecifyKind(dto.EndsAt.Value, DateTimeKind.Utc)
            : null;
        announcement.UpdatedAt = DateTime.UtcNow;
    }

    private static bool IsSafeHref(string href)
    {
        if (href.StartsWith("/", StringComparison.Ordinal)) return true;
        return Uri.TryCreate(href, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
