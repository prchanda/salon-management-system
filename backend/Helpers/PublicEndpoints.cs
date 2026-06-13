namespace backend.Helpers;

/// <summary>
/// Central allow-list of endpoints that anonymous visitors are permitted to
/// call without the shared API key. Everything not listed here is treated as
/// privileged (reception/owner only) and requires the key — a default-deny
/// posture, so a forgotten classification fails closed rather than leaking.
///
/// Keep this in sync with the matching <c>isPublicEndpoint</c> in
/// frontend/lib/api.ts.
/// </summary>
public static class PublicEndpoints
{
    private static readonly HashSet<string> PublicGet = new(StringComparer.OrdinalIgnoreCase)
    {
        "services",
        "staff",
        "reviews",
        "posts",
        "products",
    };

    private static readonly HashSet<string> PublicPost = new(StringComparer.OrdinalIgnoreCase)
    {
        "reviews",
        "appointments",
        "product-orders",
        "staff/login",
        "staff/password-reset/request",
        "staff/password-reset/complete",
    };

    /// <summary>
    /// Determines whether the given HTTP method + absolute path (e.g.
    /// "/api/customers/dormant") is public. The "/api" prefix and any query
    /// string are ignored.
    /// </summary>
    public static bool IsPublic(string method, string absolutePath)
    {
        var path = NormalizePath(absolutePath);
        if (path.Length == 0)
        {
            // Health/warmup style requests with no path: leave them alone.
            return true;
        }

        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

        return method.ToUpperInvariant() switch
        {
            "GET" => PublicGet.Contains(path)
                // Single-segment slug reads: /posts/{slug}, /products/{slug}.
                // The admin variants have an extra segment ("admin/...") and so
                // are not matched here.
                || (segments.Length == 2
                    && (segments[0].Equals("posts", StringComparison.OrdinalIgnoreCase)
                        || segments[0].Equals("products", StringComparison.OrdinalIgnoreCase))
                    && !segments[1].Equals("admin", StringComparison.OrdinalIgnoreCase)),
            "POST" => PublicPost.Contains(path),
            _ => false,
        };
    }

    private static string NormalizePath(string absolutePath)
    {
        var path = absolutePath ?? string.Empty;

        // Drop query string.
        var q = path.IndexOf('?');
        if (q >= 0) path = path[..q];

        path = path.Trim('/');

        // Strip a leading "api/" segment (the Functions route prefix).
        if (path.StartsWith("api/", StringComparison.OrdinalIgnoreCase))
        {
            path = path["api/".Length..];
        }
        else if (path.Equals("api", StringComparison.OrdinalIgnoreCase))
        {
            path = string.Empty;
        }

        return path.Trim('/');
    }
}
