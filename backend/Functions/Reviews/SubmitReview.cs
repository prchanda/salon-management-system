using backend.Data;
using backend.DTOs;
using backend.Entities;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;

namespace backend.Functions.Reviews;

public class SubmitReview
{
    private const int MinQuoteLength = 10;
    private const int MaxQuoteLength = 500;
    private const int MaxAuthorLength = 80;

    private readonly SalonDbContext _context;

    public SubmitReview(SalonDbContext context)
    {
        _context = context;
    }

    [Function("SubmitReview")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "reviews")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<CreateReviewDto>();

        if (dto == null)
        {
            return await Bad(req, "Request body is required.");
        }

        var author = (dto.AuthorName ?? string.Empty).Trim();
        var quote = (dto.Quote ?? string.Empty).Trim();
        var guestSince = string.IsNullOrWhiteSpace(dto.GuestSince)
            ? null
            : dto.GuestSince!.Trim();

        if (string.IsNullOrWhiteSpace(author) || author.Length > MaxAuthorLength)
        {
            return await Bad(req, $"authorName is required (max {MaxAuthorLength} chars).");
        }

        if (quote.Length < MinQuoteLength || quote.Length > MaxQuoteLength)
        {
            return await Bad(req, $"quote must be between {MinQuoteLength} and {MaxQuoteLength} characters.");
        }

        var rating = dto.Rating ?? 5;
        if (rating < 1 || rating > 5)
        {
            return await Bad(req, "rating must be between 1 and 5.");
        }

        var review = new Review
        {
            AuthorName = author,
            Quote = quote,
            Rating = rating,
            GuestSince = guestSince,
            IsApproved = true,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.Created);
        await response.WriteAsJsonAsync(review);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
