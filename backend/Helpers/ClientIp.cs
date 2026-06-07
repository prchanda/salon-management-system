using Microsoft.Azure.Functions.Worker.Http;

namespace backend.Helpers;

/// <summary>
/// Resolves the originating client IP from the first hop of the
/// X-Forwarded-For header (set by the Azure Functions front end). Returns
/// null when no IP is available (e.g. some local runs), in which case callers
/// should treat rate limiting as best-effort and skip it.
/// </summary>
public static class ClientIp
{
    public static string? From(HttpRequestData req)
    {
        if (req.Headers.TryGetValues("X-Forwarded-For", out var values))
        {
            var first = values.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first))
            {
                var candidate = first.Split(',')[0].Trim();
                if (!string.IsNullOrWhiteSpace(candidate))
                {
                    return candidate;
                }
            }
        }

        return null;
    }
}
