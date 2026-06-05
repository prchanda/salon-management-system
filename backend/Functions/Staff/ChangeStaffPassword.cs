using System.Net;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Self-service password change for a signed-in staff member. Verifies the
/// member's current password before setting the new one, then clears the
/// MustChangePassword flag. Used to satisfy the forced first-login change
/// for owner-created accounts (no email required).
/// </summary>
public class ChangeStaffPassword
{
    private readonly SalonDbContext _context;

    public ChangeStaffPassword(SalonDbContext context)
    {
        _context = context;
    }

    [Function("ChangeStaffPassword")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "staff/change-password")]
        HttpRequestData req)
    {
        ChangeStaffPasswordDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<ChangeStaffPasswordDto>();
        }
        catch
        {
            return await Bad(req, "Invalid JSON body.");
        }

        if (dto is null) return await Bad(req, "Missing body.");

        var currentPassword = dto.CurrentPassword ?? string.Empty;
        var newPassword = dto.NewPassword ?? string.Empty;

        if (dto.StaffId <= 0)
        {
            return await Bad(req, "Invalid account.");
        }
        if (newPassword.Length < 8)
        {
            return await Bad(req, "New password must be at least 8 characters.");
        }
        if (newPassword == currentPassword)
        {
            return await Bad(req, "Choose a password different from the temporary one.");
        }

        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.Id == dto.StaffId && s.IsActive);

        if (staff is null
            || string.IsNullOrEmpty(staff.PasswordHash)
            || string.IsNullOrEmpty(staff.PasswordSalt))
        {
            return Unauthorized(req);
        }

        if (!PasswordHasher.Verify(currentPassword, staff.PasswordHash, staff.PasswordSalt))
        {
            return Unauthorized(req);
        }

        var (hash, salt) = PasswordHasher.Hash(newPassword);
        staff.PasswordHash = hash;
        staff.PasswordSalt = salt;
        staff.MustChangePassword = false;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            staff.Id,
            staff.Username,
            staff.MustChangePassword,
        });
        return response;
    }

    private static HttpResponseData Unauthorized(HttpRequestData req)
    {
        return req.CreateResponse(HttpStatusCode.Unauthorized);
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var response = req.CreateResponse(HttpStatusCode.BadRequest);
        await response.WriteAsJsonAsync(new { message });
        return response;
    }
}
