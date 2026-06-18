using System.Net;
using System.Security.Cryptography;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Step 1 of email-based password reset: accepts an email, looks up the
/// matching staff account, stores a hashed reset token, and emails the
/// staff member a link containing the raw token.
/// Always returns 200 to avoid leaking whether an email is registered.
/// </summary>
public class RequestPasswordReset
{
    private const int MaxRequestsPerIp = 5;
    private const int MaxRequestsPerEmail = 3;
    private static readonly TimeSpan ResetWindow = TimeSpan.FromHours(1);

    private readonly SalonDbContext _context;

    public RequestPasswordReset(SalonDbContext context)
    {
        _context = context;
    }

    [Function("RequestPasswordReset")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "staff/password-reset/request")]
        HttpRequestData req)
    {
        RequestPasswordResetDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<RequestPasswordResetDto>();
        }
        catch
        {
            return Ok(req);
        }

        var email = (dto?.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (email.Length == 0) return Ok(req);

        // Throttle to curb token-spam / email bombing. Always return 200 so the
        // throttle never reveals whether an email is registered.
        var ip = ClientIp.From(req);
        if (ip != null &&
            (!RateLimiter.IsAllowed($"pwreset:ip:{ip}", MaxRequestsPerIp, ResetWindow) ||
             !RateLimiter.IsAllowed($"pwreset:email:{email}", MaxRequestsPerEmail, ResetWindow)))
        {
            return Ok(req);
        }

        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.Email == email && s.IsActive);

        // Block the reset flow for first-time-login accounts. An account still
        // carrying MustChangePassword has never chosen its own password — it
        // only has the temporary one the owner handed out. Allowing an emailed
        // reset here would let someone bypass the forced first-login change, so
        // they must complete that step first. Still return 200 below to avoid
        // revealing whether the email exists or its state.
        if (staff is not null && !staff.MustChangePassword)
        {
            var rawToken = GenerateToken();
            staff.PasswordResetTokenHash = HashToken(rawToken);
            staff.PasswordResetExpiresAt = DateTime.UtcNow.AddMinutes(30);
            await _context.SaveChangesAsync();

            var baseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
                ?? "http://localhost:3000";
            var link = $"{baseUrl.TrimEnd('/')}/reception/reset-password?token={Uri.EscapeDataString(rawToken)}";

            var html =
                $"<p>Hello {System.Net.WebUtility.HtmlEncode(staff.FullName)},</p>" +
                "<p>We received a request to reset your reception desk password. " +
                "This link is valid for 30 minutes:</p>" +
                $"<p><a href=\"{link}\">{link}</a></p>" +
                "<p>If you didn't request this, you can ignore this email.</p>";

            await EmailSender.SendAsync(email, "Reset your salon reception password", html);
        }

        return Ok(req);
    }

    private static string GenerateToken()
    {
        var bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static string HashToken(string raw)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static HttpResponseData Ok(HttpRequestData req)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        return response;
    }
}
