using System.Net;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Step 2 of email-based password reset: accepts the raw token plus a new
/// password and updates the staff record if the hash matches an unexpired
/// token.
/// </summary>
public class CompletePasswordReset
{
    private readonly SalonDbContext _context;

    public CompletePasswordReset(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CompletePasswordReset")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "staff/password-reset/complete")]
        HttpRequestData req)
    {
        CompletePasswordResetDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<CompletePasswordResetDto>();
        }
        catch
        {
            return await Bad(req, "Invalid request.");
        }

        var token = (dto?.Token ?? string.Empty).Trim();
        var newPassword = dto?.NewPassword ?? string.Empty;

        if (token.Length == 0) return await Bad(req, "Missing or invalid reset link.");
        if (newPassword.Length < 8) return await Bad(req, "Password must be at least 8 characters.");

        var hash = RequestPasswordReset.HashToken(token);
        var now = DateTime.UtcNow;

        var staff = await _context.Staff.FirstOrDefaultAsync(s =>
            s.PasswordResetTokenHash == hash &&
            s.PasswordResetExpiresAt != null &&
            s.PasswordResetExpiresAt > now &&
            s.IsActive);

        if (staff is null)
        {
            return await Bad(req, "This reset link is invalid or has expired.");
        }

        var (pwHash, pwSalt) = PasswordHasher.Hash(newPassword);
        staff.PasswordHash = pwHash;
        staff.PasswordSalt = pwSalt;
        staff.PasswordResetTokenHash = null;
        staff.PasswordResetExpiresAt = null;
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new { ok = true });
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var response = req.CreateResponse(HttpStatusCode.BadRequest);
        await response.WriteAsJsonAsync(new { message });
        return response;
    }
}
