using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Services;

public class GetServices
{
    private readonly SalonDbContext _context;

    public GetServices(SalonDbContext context)
    {
        _context = context;
    }

    [Function("GetServices")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "services")]
        HttpRequestData req)
    {
        var services = await _context.Services
            .Where(x => x.IsActive)
            .ToListAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(services);

        return response;
    }
}