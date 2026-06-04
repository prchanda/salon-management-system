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
/// Self-service staff signup. Creates a new Staff row with the
/// supplied credentials. Username must be globally unique.
/// </summary>
public class RegisterStaffAccount
{
    private readonly SalonDbContext _context;

    public RegisterStaffAccount(SalonDbContext context)
    {
        _context = context;
    }

    [Function("RegisterStaffAccount")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "staff/registration/register")]
        HttpRequestData req)
    {
        StaffRegisterDto? dto;
        try
        {
            dto = await req.ReadFromJsonAsync<StaffRegisterDto>();
        }
        catch
        {
            return await Bad(req, "Invalid JSON body.");
        }

        if (dto is null) return await Bad(req, "Missing body.");

        var fullName = (dto.FullName ?? string.Empty).Trim();
        var role = (dto.Role ?? string.Empty).Trim();
        var phone = (dto.PhoneNumber ?? string.Empty).Trim();
        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        var username = (dto.Username ?? string.Empty).Trim().ToLowerInvariant();
        var password = dto.Password ?? string.Empty;

        if (fullName.Length < 2 || fullName.Length > 80)
        {
            return await Bad(req, "Full name must be 2 to 80 characters.");
        }
        if (role.Length < 2 || role.Length > 40)
        {
            return await Bad(req, "Role must be 2 to 40 characters.");
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
        if (!System.Text.RegularExpressions.Regex.IsMatch(phone, @"^\d{10}$"))
        {
            return await Bad(req, "Phone number must be exactly 10 digits.");
        }
        if (email.Length == 0 || email.Length > 120 ||
            !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
        {
            return await Bad(req, "Please provide a valid email address.");
        }

        var usernameTaken = await _context.Staff.AnyAsync(s => s.Username == username);
        if (usernameTaken)
        {
            return await Bad(req, "That username is already in use.");
        }

        var phoneTaken = await _context.Staff.AnyAsync(s => s.PhoneNumber == phone);
        if (phoneTaken)
        {
            return await Bad(req, "That phone number is already registered.");
        }

        var emailTaken = await _context.Staff.AnyAsync(s => s.Email == email);
        if (emailTaken)
        {
            return await Bad(req, "That email address is already registered.");
        }

        var (hash, salt) = PasswordHasher.Hash(password);
        var now = DateTime.UtcNow;

        var staff = new StaffEntity
        {
            FullName = fullName,
            Role = role,
            PhoneNumber = phone,
            Email = email,
            IsActive = true,
            CreatedAt = now,
            Username = username,
            PasswordHash = hash,
            PasswordSalt = salt,
            RegisteredAt = now,
            IsApproved = false,
            ApprovedAt = null,
        };

        _context.Staff.Add(staff);
        await _context.SaveChangesAsync();

        // Best-effort owner notification — don't fail registration if email fails.
        await NotifyOwnerAsync(staff);

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            staff.Id,
            staff.FullName,
            staff.Role,
            staff.Username,
            pending = true,
        });
        return response;
    }

    private static async Task NotifyOwnerAsync(StaffEntity staff)
    {
        var ownerEmail = Environment.GetEnvironmentVariable("OWNER_EMAIL");
        if (string.IsNullOrWhiteSpace(ownerEmail)) return;

        var frontendBase = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
            ?.TrimEnd('/') ?? "http://localhost:3000";
        var reviewUrl = $"{frontendBase}/reception/staff";

        var html = $@"
<p>A new staff member just requested an account.</p>
<ul>
  <li><strong>Name:</strong> {System.Net.WebUtility.HtmlEncode(staff.FullName)}</li>
  <li><strong>Role:</strong> {System.Net.WebUtility.HtmlEncode(staff.Role)}</li>
  <li><strong>Username:</strong> {System.Net.WebUtility.HtmlEncode(staff.Username)}</li>
  <li><strong>Email:</strong> {System.Net.WebUtility.HtmlEncode(staff.Email ?? "")}</li>
  <li><strong>Phone:</strong> {System.Net.WebUtility.HtmlEncode(staff.PhoneNumber ?? "")}</li>
</ul>
<p>They cannot sign in until you approve them.</p>
<p><a href=""{reviewUrl}"">Review pending accounts</a></p>";

        await EmailSender.SendAsync(
            ownerEmail,
            $"New staff signup: {staff.FullName}",
            html);
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var response = req.CreateResponse(HttpStatusCode.BadRequest);
        await response.WriteAsJsonAsync(new { message });
        return response;
    }
}
