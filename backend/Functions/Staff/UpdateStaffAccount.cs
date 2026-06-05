using System.Net;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;

namespace backend.Functions.Staff;

/// <summary>
/// Owner-only: update an existing staff account's profile (full name, roles,
/// phone, email). Credentials and approval state are not touched here.
/// </summary>
public class UpdateStaffAccount
{
    private readonly SalonDbContext _context;

    public UpdateStaffAccount(SalonDbContext context)
    {
        _context = context;
    }

    [Function("UpdateStaffAccount")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "staff/{id:long}/profile")]
        HttpRequestData req,
        long id)
    {
        UpdateStaffProfileDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<UpdateStaffProfileDto>();
        }
        catch
        {
            return await Bad(req, "Invalid JSON body.");
        }

        if (dto is null) return await Bad(req, "Missing body.");

        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Id == id);
        if (staff is null || string.IsNullOrEmpty(staff.Username))
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        // The owner's profile is managed via configuration (OwnerSeeder) and
        // would be overwritten on the next restart, so block editing it here.
        if (staff.IsOwner)
        {
            return await Bad(req, "The owner profile is managed in configuration and cannot be edited here.");
        }

        var fullName = (dto.FullName ?? string.Empty).Trim();
        var phone = (dto.PhoneNumber ?? string.Empty).Trim();
        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();

        var requestedRoles = dto.Roles ?? SalonRoles.Split(dto.Role);
        if (!SalonRoles.TryNormalize(requestedRoles, out var roles, out var roleError))
        {
            return await Bad(req, roleError!);
        }

        if (fullName.Length < 2 || fullName.Length > 80)
        {
            return await Bad(req, "Full name must be 2 to 80 characters.");
        }
        if (!System.Text.RegularExpressions.Regex.IsMatch(phone, @"^\d{10}$"))
        {
            return await Bad(req, "Phone number must be exactly 10 digits.");
        }

        var hasEmail = email.Length > 0;
        if (hasEmail &&
            (email.Length > 120 ||
             !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$")))
        {
            return await Bad(req, "Please provide a valid email address.");
        }

        // Uniqueness among active staff, excluding this same account.
        var phoneTaken = await _context.Staff
            .AnyAsync(s => s.Id != id && s.PhoneNumber == phone && s.IsActive);
        if (phoneTaken)
        {
            return await Bad(req, "That phone number is already registered to another staff member.");
        }

        if (hasEmail)
        {
            var emailTaken = await _context.Staff
                .AnyAsync(s => s.Id != id && s.Email == email && s.IsActive);
            if (emailTaken)
            {
                return await Bad(req, "That email address is already registered to another staff member.");
            }
        }

        staff.FullName = fullName;
        staff.Role = SalonRoles.Join(roles);
        staff.PhoneNumber = phone;
        staff.Email = hasEmail ? email : null;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            staff.Id,
            staff.FullName,
            staff.Role,
            Roles = roles,
            staff.Username,
            staff.Email,
            staff.PhoneNumber,
            staff.IsActive,
            staff.IsApproved,
            staff.RegisteredAt,
            staff.ApprovedAt,
        });
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var response = req.CreateResponse(HttpStatusCode.BadRequest);
        await response.WriteAsJsonAsync(new { message });
        return response;
    }
}
