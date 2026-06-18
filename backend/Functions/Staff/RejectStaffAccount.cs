using System.Net;
using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Owner-only: reject a pending sign-up, or revoke an active account.
///
/// Two cases, branched on whether the account was ever approved:
///  - PENDING (never approved): the row is discarded — its credentials are
///    cleared so the username/email can be reused by a fresh registration.
///  - APPROVED (active staff being revoked): the account is DEACTIVATED only
///    (IsActive=false). Credentials are KEPT so the owner can reactivate it
///    later and the staff member gets their original login back. A deactivated
///    account cannot sign in (StaffLogin filters on IsActive) and is removed
///    from the public booking dropdown (GetStaff filters on IsActive).
/// The Staff row is preserved in both cases because appointments reference it.
/// </summary>
public class RejectStaffAccount
{
    private readonly SalonDbContext _context;

    public RejectStaffAccount(SalonDbContext context)
    {
        _context = context;
    }

    [Function("RejectStaffAccount")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "staff/{id:long}/account")]
        HttpRequestData req,
        long id)
    {
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Id == id);
        if (staff is null || string.IsNullOrEmpty(staff.Username))
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        // The owner account can never be revoked — doing so would lock the
        // salon out of its own admin tools.
        if (staff.IsOwner)
        {
            return req.CreateResponse(HttpStatusCode.Forbidden);
        }

        var emailTo = staff.Email;
        var firstName = staff.FullName.Split(' ').FirstOrDefault() ?? "there";
        var wasApproved = staff.IsApproved;

        if (wasApproved)
        {
            // Revoke an active account: deactivate but keep credentials so it
            // can be reactivated later with the same login.
            staff.IsActive = false;
            staff.PasswordResetTokenHash = null;
            staff.PasswordResetExpiresAt = null;
        }
        else
        {
            // Reject a pending sign-up: discard credentials so the
            // username/email are freed for a future registration.
            staff.Username = null;
            staff.PasswordHash = null;
            staff.PasswordSalt = null;
            staff.RegisteredAt = null;
            staff.IsApproved = false;
            staff.ApprovedAt = null;
            staff.PasswordResetTokenHash = null;
            staff.PasswordResetExpiresAt = null;
            staff.IsActive = false;
        }

        await _context.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(emailTo))
        {
            var subject = wasApproved
                ? "Your reception account access has been revoked"
                : "Your reception account request was not approved";
            var body = wasApproved
                ? "your reception account has been deactivated"
                : "your account request was not approved at this time";
            var html = $@"
<p>Hi {System.Net.WebUtility.HtmlEncode(firstName)},</p>
<p>Just a note that {body}. Please contact the salon owner if you believe this was a mistake.</p>
<p>— Mr. &amp; Mrs. Cuts Salon</p>";
            await EmailSender.SendAsync(emailTo, subject, html);
        }

        return req.CreateResponse(HttpStatusCode.NoContent);
    }
}
