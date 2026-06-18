namespace backend.DTOs;

public class OwnerCreateStaffAccountDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public List<string>? Roles { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UpdateStaffProfileDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public List<string>? Roles { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
}

public class ReactivateStaffAccountDto
{
    // Optional temporary password. When provided, the account is reactivated
    // with this password and the staff member is forced to change it on their
    // next sign-in. When omitted, the original password is kept.
    public string? TempPassword { get; set; }
}

public class StaffLoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ChangeStaffPasswordDto
{
    public long StaffId { get; set; }
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class RequestPasswordResetDto
{
    public string Email { get; set; } = string.Empty;
}

public class CompletePasswordResetDto
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
