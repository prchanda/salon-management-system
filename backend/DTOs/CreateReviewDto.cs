namespace backend.DTOs;

public class CreateReviewDto
{
    public string? AuthorName { get; set; }
    public string? Quote { get; set; }
    public int? Rating { get; set; }
    public string? GuestSince { get; set; }
}
