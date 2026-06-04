namespace backend.DTOs;

public class UpdatePostDto
{
    public string? Title { get; set; }
    public string? Excerpt { get; set; }
    public string? Body { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Tags { get; set; }
    public bool? IsPublished { get; set; }
}
