using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Staff;

/// <summary>Lists active staff who have not yet created an account.</summary>
public class GetStaffAvailableForRegistration
{
    private readonly SalonDbContext _context;

    public GetStaffAvailableForRegistration(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetStaffAvailableForRegistration")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "staff/registration/available")]
        HttpRequestData req)
    {
        var staff = await _context.Staff
            .Where(s => s.IsActive && s.Username == null)
            .OrderBy(s => s.FullName)
            .Select(s => new { s.Id, s.FullName, s.Role })
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(staff);
        return response;
    }
}
