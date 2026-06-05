using System.Net;
using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Owner-only: reject (or revoke) a staff account. Clears the credentials
/// so the user cannot log in. The Staff row is preserved (kept inactive)
/// because appointments may still reference it.
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

        staff.Username = null;
        staff.PasswordHash = null;
        staff.PasswordSalt = null;
        staff.RegisteredAt = null;
        staff.IsApproved = false;
        staff.ApprovedAt = null;
        staff.PasswordResetTokenHash = null;
        staff.PasswordResetExpiresAt = null;
        staff.IsActive = false;

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
