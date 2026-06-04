using System.Security.Cryptography;
using System.Text;

namespace backend.Helpers;

/// <summary>
/// PBKDF2/SHA-256 password hashing for staff self-service accounts.
/// Uses 32-byte output and 16-byte salt with 100,000 iterations.
/// </summary>
public static class PasswordHasher
{
    private const int Iterations = 100_000;
    private const int SaltBytes = 16;
    private const int HashBytes = 32;

    public static (string Hash, string Salt) Hash(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(SaltBytes);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            saltBytes,
            Iterations,
            HashAlgorithmName.SHA256,
            HashBytes);

        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }

    public static bool Verify(string password, string storedHash, string storedSalt)
    {
        if (string.IsNullOrEmpty(storedHash) || string.IsNullOrEmpty(storedSalt))
        {
            return false;
        }

        byte[] saltBytes;
        byte[] expectedBytes;
        try
        {
            saltBytes = Convert.FromBase64String(storedSalt);
            expectedBytes = Convert.FromBase64String(storedHash);
        }
        catch (FormatException)
        {
            return false;
        }

        var actualBytes = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            saltBytes,
            Iterations,
            HashAlgorithmName.SHA256,
            expectedBytes.Length);

        return CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);
    }
}
