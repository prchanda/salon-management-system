using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace backend.Helpers;

/// <summary>
/// Tiny wrapper around the Resend HTTPS API.
/// Configure with the RESEND_API_KEY and RESEND_FROM environment variables.
/// </summary>
public static class EmailSender
{
    private static readonly HttpClient _http = new();

    public static async Task<(bool ok, string? error)> SendAsync(
        string to, string subject, string html)
    {
        var apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY");
        var from = Environment.GetEnvironmentVariable("RESEND_FROM")
            ?? "Mr. & Mrs. Cuts <onboarding@resend.dev>";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return (false, "RESEND_API_KEY is not configured.");
        }

        var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = JsonContent.Create(new
            {
                from,
                to = new[] { to },
                subject,
                html,
            }),
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            var res = await _http.SendAsync(req);
            if (res.IsSuccessStatusCode) return (true, null);
            var body = await res.Content.ReadAsStringAsync();
            return (false, $"Resend returned {(int)res.StatusCode}: {body}");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }
}
