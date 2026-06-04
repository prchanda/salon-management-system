using backend.Data;
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
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(staff);

        return response;
    }
}
