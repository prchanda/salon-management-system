using backend.Data;
using backend.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace backend.Helpers;

/// <summary>
/// Bootstraps the IT-admin account on startup from configuration
/// (environment variables / local.settings.json) so that no credentials are
/// ever hardcoded in source. Mirrors <see cref="OwnerSeeder"/>.
///
/// The admin is modelled as an owner-privileged Staff row (IsOwner = true), so
/// it automatically inherits every owner-only protection — it is hidden from
/// the staff-management list, cannot be edited/revoked there, and logs in with
/// full management access — without any new column or extra checks.
///
/// Unlike the real owner, the admin is a pure system account, not a member of
/// the salon roster: its role (ADMIN_ROLE, default "Admin") is deliberately
/// NOT one of the salon specialist roles, which is how the booking/roster
/// endpoint keeps it from showing up as a bookable specialist.
///
/// Behaviour:
///   • Runs only when ADMIN_TEMP_PASSWORD is set.
///   • Creates the admin exactly once with a temporary password and the
///     MustChangePassword flag, forcing a password change on first sign-in.
///   • On later startups the admin's PROFILE fields (full name, role, email,
///     phone) are kept in sync with config, but the username and password are
///     never touched.
///
/// NOTE: ADMIN_USERNAME must differ from OWNER_USERNAME (both seeders identify
/// their row by username).
/// </summary>
public static class AdminSeeder
{
    public static void Seed(SalonDbContext db, IConfiguration config)
    {
        var tempPassword = config["ADMIN_TEMP_PASSWORD"];
        if (string.IsNullOrWhiteSpace(tempPassword))
        {
            // No temporary password configured — nothing to seed.
            return;
        }

        var username = (config["ADMIN_USERNAME"] ?? "admin").Trim().ToLowerInvariant();
        var fullName = (config["ADMIN_FULL_NAME"] ?? "IT Admin").Trim();
        var role = (config["ADMIN_ROLE"] ?? "Admin").Trim();
        var email = config["ADMIN_EMAIL"]?.Trim();
        var normalizedEmail = string.IsNullOrWhiteSpace(email)
            ? null
            : email.ToLowerInvariant();
        var phoneDigits = new string((config["ADMIN_PHONE"] ?? string.Empty)
            .Where(char.IsDigit).ToArray());
        var phone = phoneDigits.Length == 0 ? null : phoneDigits;

        var existing = db.Staff.FirstOrDefault(s => s.Username == username);
        if (existing is not null)
        {
            // Only sync rows that are already owner-privileged (i.e. our admin
            // row). Never hijack a regular staff account that happens to use
            // this username.
            if (!existing.IsOwner)
            {
                Console.Error.WriteLine(
                    $"[AdminSeeder] Username '{username}' is in use by a non-admin account; skipping admin seed.");
                return;
            }

            // Keep the admin's profile in sync with config; never touch the
            // username/password/approval. Only save if something changed.
            var changed = false;
            if (existing.FullName != fullName) { existing.FullName = fullName; changed = true; }
            if (existing.Role != role) { existing.Role = role; changed = true; }
            if (existing.Email != normalizedEmail) { existing.Email = normalizedEmail; changed = true; }
            if (existing.PhoneNumber != phone) { existing.PhoneNumber = phone; changed = true; }

            if (changed)
            {
                db.SaveChanges();
                Console.WriteLine("[AdminSeeder] Updated admin profile from config.");
            }
            return;
        }

        var (hash, salt) = PasswordHasher.Hash(tempPassword);
        var now = DateTime.UtcNow;

        db.Staff.Add(new Staff
        {
            FullName = fullName,
            Role = role,
            Email = normalizedEmail,
            PhoneNumber = phone,
            IsActive = true,
            IsOwner = true,
            IsApproved = true,
            ApprovedAt = now,
            Username = username,
            PasswordHash = hash,
            PasswordSalt = salt,
            RegisteredAt = now,
            MustChangePassword = true,
            CreatedAt = now,
        });

        db.SaveChanges();
        Console.WriteLine(
            $"[AdminSeeder] Seeded admin account '{username}' (must change password on first login).");
    }
}
