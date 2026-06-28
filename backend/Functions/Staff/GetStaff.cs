using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Staff;

public class GetStaff
{
    private readonly SalonDbContext _context;

    public GetStaff(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetStaff")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "staff")]
        HttpRequestData req)
    {
        var staff = await _context.Staff
            .Where(x => x.IsActive)
            .OrderBy(x => x.FullName)
            .Select(x => new
            {
                x.Id,
                x.FullName,
                x.Role,
                x.IsActive,
                x.CreatedAt,
            })
            .ToListAsync();

        // Project to a public-safe shape (no credentials, no contact details)
        // and split the stored role string into a roles array for the UI.
        // Only rows that hold a real salon specialist role appear in the roster
        // and booking pickers — this keeps the bookable owner visible while
        // excluding system accounts such as the IT-admin (role "Admin"), which
        // is owner-privileged but not a member of the salon roster.
        var result = staff
            .Where(s => SalonRoles.HasAny(s.Role))
            .Select(s => new
            {
                s.Id,
                s.FullName,
                s.Role,
                Roles = SalonRoles.Split(s.Role),
                s.IsActive,
                s.CreatedAt,
            });

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(result);

        return response;
    }
}
