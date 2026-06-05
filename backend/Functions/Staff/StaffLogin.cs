using System.Net;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Verifies staff credentials. Returns the public staff fields the
/// frontend needs to populate its session cookie.
/// </summary>
public class StaffLogin
{
    private readonly SalonDbContext _context;

    public StaffLogin(SalonDbContext context)
    {
        _context = context;
    }

    [Function("StaffLogin")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "staff/login")]
        HttpRequestData req)
    {
        StaffLoginDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<StaffLoginDto>();
        }
        catch
        {
            return Unauthorized(req);
        }

        if (dto is null) return Unauthorized(req);

        var identifier = (dto.Username ?? string.Empty).Trim();
        var password = dto.Password ?? string.Empty;
        if (identifier.Length == 0 || password.Length == 0)
        {
            return Unauthorized(req);
        }

        var usernameLookup = identifier.ToLowerInvariant();
        var phoneDigits = new string(identifier.Where(char.IsDigit).ToArray());

        // Try username first, then fall back to phone number (digits-only compare).
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.Username == usernameLookup && s.IsActive);

        if (staff is null && phoneDigits.Length >= 4)
        {
            // EF can't translate the digit-stripping expression, so pull active staff
            // with a non-empty phone and compare client-side. Set is tiny in practice.
            var candidates = await _context.Staff
                .Where(s => s.IsActive && s.PhoneNumber != null && s.PhoneNumber != "")
                .ToListAsync();
            staff = candidates.FirstOrDefault(s =>
                new string((s.PhoneNumber ?? string.Empty).Where(char.IsDigit).ToArray())
                    == phoneDigits);
        }

        if (staff is null
            || string.IsNullOrEmpty(staff.PasswordHash)
            || string.IsNullOrEmpty(staff.PasswordSalt))
        {
            return Unauthorized(req);
        }

        if (!PasswordHasher.Verify(password, staff.PasswordHash, staff.PasswordSalt))
        {
            return Unauthorized(req);
        }

        if (!staff.IsApproved)
        {
            var pending = req.CreateResponse(HttpStatusCode.Forbidden);
            await pending.WriteAsJsonAsync(new { reason = "pending_approval" });
            return pending;
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            staff.Id,
            staff.FullName,
            staff.Role,
            staff.Username,
            staff.MustChangePassword,
            staff.IsOwner,
        });
        return response;
    }

    private static HttpResponseData Unauthorized(HttpRequestData req)
    {
        var response = req.CreateResponse(HttpStatusCode.Unauthorized);
        return response;
    }
}
