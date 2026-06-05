using System.Net;
using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Lightweight session status for a single staff member. Powers the
/// server-side enforcement of the forced password change (so a deleted
/// cookie cannot bypass it) and active/approval checks on each page load.
/// </summary>
public class GetStaffSessionStatus
{
    private readonly SalonDbContext _context;

    public GetStaffSessionStatus(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetStaffSessionStatus")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "staff/{id:long}/session-status")]
        HttpRequestData req,
        long id)
    {
        var staff = await _context.Staff
            .Where(s => s.Id == id)
            .Select(s => new
            {
                s.Id,
                s.IsActive,
                s.IsApproved,
                s.MustChangePassword,
            })
            .FirstOrDefaultAsync();

        if (staff is null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(staff);
        return response;
    }
}
