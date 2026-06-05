using backend.Data;
using backend.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace backend.Helpers;

/// <summary>
/// Bootstraps the single salon-owner account on startup from configuration
/// (environment variables / local.settings.json) so that no credentials are
/// ever hardcoded in source.
///
/// Behaviour:
///   • Runs only when OWNER_TEMP_PASSWORD is set.
///   • Creates the owner exactly once with a temporary password and the
///     MustChangePassword flag, forcing a password change on first sign-in.
///   • On later startups the owner's PROFILE fields (full name, role, email,
///     phone) are kept in sync with config, but her username and password are
///     never touched — so editing config + restarting updates her details
///     without resetting the password she chose.
/// </summary>
public static class OwnerSeeder
{
    public static void Seed(SalonDbContext db, IConfiguration config)
    {
        var tempPassword = config["OWNER_TEMP_PASSWORD"];
        if (string.IsNullOrWhiteSpace(tempPassword))
        {
            // No temporary password configured — nothing to seed.
            return;
        }

        var username = (config["OWNER_USERNAME"] ?? "owner").Trim().ToLowerInvariant();
        var fullName = (config["OWNER_FULL_NAME"] ?? "Salon Owner").Trim();
        var role = (config["OWNER_ROLE"] ?? "Owner").Trim();
        var email = config["OWNER_EMAIL"]?.Trim();
        var normalizedEmail = string.IsNullOrWhiteSpace(email)
            ? null
            : email.ToLowerInvariant();
        var phoneDigits = new string((config["OWNER_PHONE"] ?? string.Empty)
            .Where(char.IsDigit).ToArray());
        var phone = phoneDigits.Length == 0 ? null : phoneDigits;

        var existing = db.Staff.FirstOrDefault(s => s.IsOwner);
        if (existing is not null)
        {
            // Keep the owner's profile in sync with config; never touch her
            // username/password/approval. Only save if something changed.
            var changed = false;
            if (existing.FullName != fullName) { existing.FullName = fullName; changed = true; }
            if (existing.Role != role) { existing.Role = role; changed = true; }
            if (existing.Email != normalizedEmail) { existing.Email = normalizedEmail; changed = true; }
            if (existing.PhoneNumber != phone) { existing.PhoneNumber = phone; changed = true; }

            if (changed)
            {
                db.SaveChanges();
                Console.WriteLine("[OwnerSeeder] Updated owner profile from config.");
            }
            return;
        }

        // If a non-owner staff row already claims this username, skip rather
        // than crash on the unique-index violation.
        if (db.Staff.Any(s => s.Username == username))
        {
            Console.Error.WriteLine(
                $"[OwnerSeeder] Username '{username}' already in use; skipping owner seed.");
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
            $"[OwnerSeeder] Seeded owner account '{username}' (must change password on first login).");
    }
}
