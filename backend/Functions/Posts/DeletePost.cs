using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Posts;

public class DeletePost
{
    private readonly SalonDbContext _context;

    public DeletePost(SalonDbContext context)
    {
        _context = context;
    }

    [Function("DeletePost")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "posts/{id:long}")]
        HttpRequestData req,
        long id)
    {
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id);
        if (post is null) return req.CreateResponse(HttpStatusCode.NotFound);

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();

        return req.CreateResponse(HttpStatusCode.NoContent);
    }
}
