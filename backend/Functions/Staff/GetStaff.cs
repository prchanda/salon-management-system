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
        var result = staff.Select(s => new
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
