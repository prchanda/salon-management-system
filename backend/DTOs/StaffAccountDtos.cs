namespace backend.DTOs;

public class StaffRegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public List<string>? Roles { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

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

public class StaffLoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class StaffResetPasswordDto
{
    public string Username { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
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
