using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Services;

public class GetAdminServices
{
    private readonly SalonDbContext _context;

    public GetAdminServices(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetAdminServices")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "services/admin/list")]
        HttpRequestData req)
    {
        var services = await _context.Services
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(services);
        return response;
    }
}
