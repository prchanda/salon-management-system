using System.Net;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Owner-only: reactivate a previously deactivated staff account. Restores
/// the account's original login (username is always kept). The owner may also
/// supply a temporary password — useful when the staff member has forgotten
/// theirs — which forces a password change on next sign-in. Sends a
/// confirmation email.
/// </summary>
public class ReactivateStaffAccount
{
    private readonly SalonDbContext _context;

    public ReactivateStaffAccount(SalonDbContext context)
    {
        _context = context;
    }

    [Function("ReactivateStaffAccount")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "staff/{id:long}/reactivate")]
        HttpRequestData req,
        long id)
    {
        // Body is optional — only present when the owner sets a temp password.
        ReactivateStaffAccountDto? dto = null;
        try
        {
            dto = await req.ReadFromJsonAsync<ReactivateStaffAccountDto>();
        }
        catch
        {
            // No / invalid body simply means "reactivate, keep existing password".
        }

        var tempPassword = (dto?.TempPassword ?? string.Empty).Trim();
        var hasTempPassword = tempPassword.Length > 0;
        if (hasTempPassword && tempPassword.Length < 8)
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteAsJsonAsync(new
            {
                message = "Temporary password must be at least 8 characters.",
            });
            return bad;
        }

        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Id == id);
        // Only real (registered) accounts can be reactivated. A null username
        // means the row was a rejected sign-up whose credentials were cleared.
        if (staff is null || string.IsNullOrEmpty(staff.Username))
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        if (staff.IsOwner)
        {
            return req.CreateResponse(HttpStatusCode.Forbidden);
        }

        // Already active — nothing to do, treat as success (idempotent).
        if (staff.IsActive)
        {
            return await Ok(req, staff);
        }

        // While deactivated, the account's email is released (the unique index
        // on email is scoped to active rows). If another ACTIVE account has
        // since claimed it, reactivating would violate that index — block with
        // a clear message instead of letting the save throw.
        if (!string.IsNullOrEmpty(staff.Email))
        {
            var emailTaken = await _context.Staff.AnyAsync(
                s => s.Id != staff.Id && s.Email == staff.Email && s.IsActive);
            if (emailTaken)
            {
                var conflict = req.CreateResponse(HttpStatusCode.Conflict);
                await conflict.WriteAsJsonAsync(new
                {
                    message =
                        "That email address is now used by another active account. " +
                        "Update this account's email before reactivating it.",
                });
                return conflict;
            }
        }

        staff.IsActive = true;
        if (hasTempPassword)
        {
            // Set the temporary password and force a change on next sign-in.
            // Username is untouched, so the staff member keeps their login name.
            var (hash, salt) = PasswordHasher.Hash(tempPassword);
            staff.PasswordHash = hash;
            staff.PasswordSalt = salt;
            staff.MustChangePassword = true;
            // Invalidate any outstanding password-reset link.
            staff.PasswordResetTokenHash = null;
            staff.PasswordResetExpiresAt = null;
        }
        await _context.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(staff.Email))
        {
            var frontendBase = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
                ?.TrimEnd('/') ?? "http://localhost:3000";
            var loginUrl = $"{frontendBase}/reception/login";
            var firstName = staff.FullName.Split(' ').FirstOrDefault() ?? "there";
            var credentialLine = hasTempPassword
                ? "<p>Your access has been restored with a temporary password. " +
                  "Please ask the salon owner for it, sign in with your existing " +
                  "username, and you'll be prompted to set a new password.</p>"
                : "<p>You can sign in again with your existing username and password.</p>";
            var html = $@"
<p>Hi {System.Net.WebUtility.HtmlEncode(firstName)},</p>
<p>Your reception account has been reactivated.</p>
{credentialLine}
<p><a href=""{loginUrl}"">Sign in to the reception desk</a></p>
<p>— Mr. &amp; Mrs. Cuts Salon</p>";
            await EmailSender.SendAsync(
                staff.Email,
                "Your reception account access has been restored",
                html);
        }

        return await Ok(req, staff);
    }

    private static async Task<HttpResponseData> Ok(HttpRequestData req, Entities.Staff staff)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            staff.Id,
            staff.IsActive,
            staff.IsApproved,
            staff.MustChangePassword,
        });
        return response;
    }
}
