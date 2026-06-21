using System.Net;
using backend.Data;
using backend.DTOs;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using StaffEntity = backend.Entities.Staff;

namespace backend.Functions.Staff;

/// <summary>
/// Owner-only: manually create a staff account with login credentials.
/// Used for staff members who have no email address and therefore
/// cannot self-register. Email is optional and the account is
/// approved immediately so the staff member can sign in right away.
/// </summary>
public class CreateStaffAccountByOwner
{
    private readonly SalonDbContext _context;

    public CreateStaffAccountByOwner(SalonDbContext context)
    {
        _context = context;
    }

    [Function("CreateStaffAccountByOwner")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "staff/accounts")]
        HttpRequestData req)
    {
        OwnerCreateStaffAccountDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<OwnerCreateStaffAccountDto>();
        }
        catch
        {
            return await Bad(req, "Invalid JSON body.");
        }

        if (dto is null) return await Bad(req, "Missing body.");

        var fullName = (dto.FullName ?? string.Empty).Trim();
        var phone = (dto.PhoneNumber ?? string.Empty).Trim();
        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        var username = (dto.Username ?? string.Empty).Trim().ToLowerInvariant();
        var password = dto.Password ?? string.Empty;

        // Accept either a structured roles array or a legacy comma-separated
        // Role string, then validate against the fixed catalogue.
        var requestedRoles = dto.Roles ?? SalonRoles.Split(dto.Role);
        if (!SalonRoles.TryNormalize(requestedRoles, out var roles, out var roleError))
        {
            return await Bad(req, roleError!);
        }

        if (fullName.Length < 2 || fullName.Length > 80)
        {
            return await Bad(req, "Full name must be 2 to 80 characters.");
        }
        if (username.Length < 3 || username.Length > 32)
        {
            return await Bad(req, "Username must be 3 to 32 characters.");
        }
        if (!System.Text.RegularExpressions.Regex.IsMatch(username, "^[a-z0-9._-]+$"))
        {
            return await Bad(req, "Username may contain only lowercase letters, numbers, dot, dash, underscore.");
        }
        if (password.Length < 8)
        {
            return await Bad(req, "Password must be at least 8 characters.");
        }
        // Phone is optional. Validate format only when present.
        var hasPhone = phone.Length > 0;
        if (hasPhone && !System.Text.RegularExpressions.Regex.IsMatch(phone, @"^\d{10}$"))
        {
            return await Bad(req, "Phone number must be exactly 10 digits.");
        }

        // Email is optional for owner-created accounts. Validate only when present.
        var hasEmail = email.Length > 0;
        if (hasEmail &&
            (email.Length > 120 ||
             !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$")))
        {
            return await Bad(req, "Please provide a valid email address.");
        }

        var usernameTaken = await _context.Staff.AnyAsync(s => s.Username == username);
        if (usernameTaken)
        {
            return await Bad(req, "That username is already in use.");
        }

        var phoneTaken = await _context.Staff.AnyAsync(s => s.PhoneNumber == phone && s.IsActive);
        if (hasPhone && phoneTaken)
        {
            return await Bad(req, "That phone number is already registered.");
        }

        if (hasEmail)
        {
            var emailTaken = await _context.Staff.AnyAsync(s => s.Email == email && s.IsActive);
            if (emailTaken)
            {
                return await Bad(req, "That email address is already registered.");
            }
        }

        var (hash, salt) = PasswordHasher.Hash(password);
        var now = DateTime.UtcNow;

        var staff = new StaffEntity
        {
            FullName = fullName,
            Role = SalonRoles.Join(roles),
            PhoneNumber = hasPhone ? phone : null,
            Email = hasEmail ? email : null,
            IsActive = true,
            CreatedAt = now,
            Username = username,
            PasswordHash = hash,
            PasswordSalt = salt,
            RegisteredAt = now,
            // Owner-created accounts are trusted and approved immediately.
            IsApproved = true,
            ApprovedAt = now,
            // The owner sets a temporary password; force a change on first login.
            MustChangePassword = true,
        };

        _context.Staff.Add(staff);
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
            staff.MustChangePassword,
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
