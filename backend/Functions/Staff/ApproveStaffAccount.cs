using System.Net;
using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Owner-only: approves a pending staff registration so that
/// the staff member can sign in. Sends a confirmation email.
/// </summary>
public class ApproveStaffAccount
{
    private readonly SalonDbContext _context;

    public ApproveStaffAccount(SalonDbContext context)
    {
        _context = context;
    }

    [Function("ApproveStaffAccount")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "staff/{id:long}/approve")]
        HttpRequestData req,
        long id)
    {
        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Id == id);
        if (staff is null || string.IsNullOrEmpty(staff.Username))
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        if (!staff.IsApproved)
        {
            staff.IsApproved = true;
            staff.ApprovedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(staff.Email))
            {
                var frontendBase = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
                    ?.TrimEnd('/') ?? "http://localhost:3000";
                var loginUrl = $"{frontendBase}/reception/login";
                var html = $@"
<p>Hi {System.Net.WebUtility.HtmlEncode(staff.FullName.Split(' ')[0])},</p>
<p>Your reception account has been approved. You can now sign in.</p>
<p><a href=""{loginUrl}"">Sign in to the reception desk</a></p>
<p>— Mr. &amp; Mrs. Cuts Salon</p>";
                await EmailSender.SendAsync(
                    staff.Email,
                    "Your reception account is approved",
                    html);
            }
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            staff.Id,
            staff.IsApproved,
            staff.ApprovedAt,
        });
        return response;
    }
}
