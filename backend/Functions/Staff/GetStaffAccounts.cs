using System.Net;
using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Owner-only: list every staff account (registered users only),
/// with their approval status. Powers the /reception/staff admin page.
/// </summary>
public class GetStaffAccounts
{
    private readonly SalonDbContext _context;

    public GetStaffAccounts(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetStaffAccounts")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "staff/accounts")]
        HttpRequestData req)
    {
        var accounts = await _context.Staff
            .Where(s => s.Username != null && !s.IsOwner)
            .OrderBy(s => s.IsApproved)
            .ThenByDescending(s => s.RegisteredAt)
            .Select(s => new
            {
                s.Id,
                s.FullName,
                s.Role,
                s.Username,
                s.Email,
                s.PhoneNumber,
                s.IsActive,
                s.IsApproved,
                s.RegisteredAt,
                s.ApprovedAt,
            })
            .ToListAsync();

        // Split the stored role string into a roles array for the UI.
        var result = accounts.Select(s => new
        {
            s.Id,
            s.FullName,
            s.Role,
            Roles = SalonRoles.Split(s.Role),
            s.Username,
            s.Email,
            s.PhoneNumber,
            s.IsActive,
            s.IsApproved,
            s.RegisteredAt,
            s.ApprovedAt,
        });

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(result);
        return response;
    }
}
