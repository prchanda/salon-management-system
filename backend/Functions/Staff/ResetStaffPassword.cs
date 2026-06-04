using System.Net;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Resets a staff member's password to a new value. Authorization is handled
/// upstream by the Next.js server action (which verifies the salon-owner
/// override password before calling this endpoint).
/// </summary>
public class ResetStaffPassword
{
    private readonly SalonDbContext _context;

    public ResetStaffPassword(SalonDbContext context)
    {
        _context = context;
    }

    [Function("ResetStaffPassword")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "staff/reset-password")]
        HttpRequestData req)
    {
        StaffResetPasswordDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<StaffResetPasswordDto>();
        }
        catch
        {
            return await Bad(req, "Invalid JSON body.");
        }

        if (dto is null) return await Bad(req, "Missing body.");

        var username = (dto.Username ?? string.Empty).Trim().ToLowerInvariant();
        var newPassword = dto.NewPassword ?? string.Empty;

        if (string.IsNullOrEmpty(username))
        {
            return await Bad(req, "Username is required.");
        }
        if (newPassword.Length < 8)
        {
            return await Bad(req, "Password must be at least 8 characters.");
        }

        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Username == username);
        if (staff is null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteAsJsonAsync(new { message = "No account found with that username." });
            return notFound;
        }

        var (hash, salt) = PasswordHasher.Hash(newPassword);
        staff.PasswordHash = hash;
        staff.PasswordSalt = salt;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new { staff.Username });
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var response = req.CreateResponse(HttpStatusCode.BadRequest);
        await response.WriteAsJsonAsync(new { message });
        return response;
    }
}
