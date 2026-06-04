using System.Collections.Concurrent;

namespace backend.Helpers;

/// <summary>
/// Lightweight in-memory sliding-window rate limiter. Keyed by an arbitrary
/// string (e.g. an IP address). State lives in process memory, which is fine
/// for a single-instance Functions host; it resets on restart and is not shared
/// across scaled-out instances. Used to throttle anonymous public bookings.
/// </summary>
public static class RateLimiter
{
    private static readonly ConcurrentDictionary<string, List<DateTime>> Hits = new();

    /// <summary>
    /// Records an attempt for <paramref name="key"/> and returns false if the
    /// number of attempts within <paramref name="window"/> exceeds
    /// <paramref name="maxHits"/>.
    /// </summary>
    public static bool IsAllowed(string key, int maxHits, TimeSpan window)
    {
        var now = DateTime.UtcNow;
        var cutoff = now - window;

        var timestamps = Hits.GetOrAdd(key, _ => new List<DateTime>());

        lock (timestamps)
        {
            timestamps.RemoveAll(t => t < cutoff);

            if (timestamps.Count >= maxHits)
            {
                return false;
            }

            timestamps.Add(now);
            return true;
        }
    }
}
