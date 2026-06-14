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

    // Guards against the dictionary growing without bound: every key (e.g. one
    // per visitor IP) was previously kept forever, slowly leaking memory the
    // longer the host stayed up. We sweep out expired buckets at most once a
    // minute so the cost is negligible.
    private static long _lastSweepTicks = DateTime.UtcNow.Ticks;
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(1);

    // Only evict a bucket once it has been idle longer than the largest rate
    // limit window in use (currently 1h for reviews/password reset). This keeps
    // memory bounded without ever resetting a limit that is still in effect.
    private static readonly TimeSpan Retention = TimeSpan.FromHours(1);

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

        bool allowed;
        lock (timestamps)
        {
            timestamps.RemoveAll(t => t < cutoff);

            if (timestamps.Count >= maxHits)
            {
                allowed = false;
            }
            else
            {
                timestamps.Add(now);
                allowed = true;
            }
        }

        SweepIfDue(now);
        return allowed;
    }

    /// <summary>
    /// Periodically removes buckets whose timestamps have all expired so the
    /// backing dictionary doesn't accumulate one entry per distinct key forever.
    /// </summary>
    private static void SweepIfDue(DateTime now)
    {
        var lastSweep = new DateTime(Interlocked.Read(ref _lastSweepTicks), DateTimeKind.Utc);
        if (now - lastSweep < SweepInterval)
        {
            return;
        }

        // Claim the sweep slot; if another thread beat us to it, skip.
        if (Interlocked.CompareExchange(ref _lastSweepTicks, now.Ticks, lastSweep.Ticks) != lastSweep.Ticks)
        {
            return;
        }

        var evictBefore = now - Retention;
        foreach (var entry in Hits)
        {
            lock (entry.Value)
            {
                if (entry.Value.Count == 0 || entry.Value[^1] < evictBefore)
                {
                    Hits.TryRemove(entry.Key, out _);
                }
            }
        }
    }
}
