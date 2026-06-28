using backend.Data;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Functions;

/// <summary>
/// Keeps the Consumption-plan Functions host (and the Supabase connection
/// pool / EF model) warm so visitors don't pay the full cold-start cost.
///
/// A timer trigger fires often enough that Azure keeps a single instance
/// provisioned, and the lightweight DB round-trip ensures the Npgsql pool and
/// EF model are already initialised when a real request arrives.
///
/// The same tick also pings the frontend's server-rendered host (Azure Static
/// Web Apps managed SSR function), which has its OWN cold start independent of
/// this API. Without this, the first visitor to a server-rendered page (e.g.
/// the reception login) paid a 5–10s Node bootstrap even though no backend
/// call was involved.
///
/// Note: this mitigates — but does not guarantee removal of — cold starts on
/// the Consumption plan (e.g. after a deploy or a scale-out). For a hard
/// guarantee move to Flex Consumption with always-ready instances.
/// </summary>
public class KeepWarm
{
    // Shared across invocations so we reuse sockets instead of leaking one
    // HttpClient (and its connection) per timer tick.
    private static readonly HttpClient Http = new()
    {
        Timeout = TimeSpan.FromSeconds(20),
    };

    // Ensures the config-driven account seeding is attempted at most once per
    // worker process. The startup background task is best-effort and has not
    // proven reliable on the Consumption host, so this guaranteed timer trigger
    // is the dependable place to make sure the owner/admin accounts exist.
    private static int _seedAttempted;

    private readonly SalonDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<KeepWarm> _logger;

    public KeepWarm(SalonDbContext context, IConfiguration config, ILogger<KeepWarm> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    // Every 5 minutes. Consumption idles instances out after ~20 min, so this
    // comfortably keeps one warm without being wasteful.
    [Function("KeepWarm")]
    public async Task Run([TimerTrigger("0 */5 * * * *")] TimerInfo timer)
    {
        try
        {
            // Cheapest meaningful round-trip: opens a pooled connection and
            // exercises the EF pipeline without scanning any table.
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");
        }
        catch (Exception ex)
        {
            // A failed warm-up ping is non-fatal; just log and move on.
            _logger.LogWarning(ex, "[KeepWarm] DB warm-up ping failed.");
        }

        EnsureAccountsSeeded();

        await WarmFrontendAsync();
    }

    /// <summary>
    /// Idempotently ensures the config-driven owner and admin accounts exist.
    /// Both seeders are no-ops once their row is present, so this is cheap (two
    /// indexed username lookups) and safe to run from the warm-up tick. Guarded
    /// to run at most once per worker process; the DB lookups make it safe even
    /// if it runs again after a scale-out brings up a new instance.
    /// </summary>
    private void EnsureAccountsSeeded()
    {
        if (Interlocked.Exchange(ref _seedAttempted, 1) == 1)
        {
            return;
        }

        try
        {
            OwnerSeeder.Seed(_context, _config);
            AdminSeeder.Seed(_context, _config);
        }
        catch (Exception ex)
        {
            // Allow a later tick to retry if this attempt failed transiently.
            Interlocked.Exchange(ref _seedAttempted, 0);
            _logger.LogWarning(ex, "[KeepWarm] Account seeding failed; will retry on a later tick.");
        }
    }

    /// <summary>
    /// Hits a server-rendered frontend route so the Azure SWA SSR (Node)
    /// function stays warm. Targets the reception login page deliberately: it
    /// is server-rendered (so it exercises the SSR function) but makes no
    /// backend/database call of its own, so this never adds DB load.
    /// </summary>
    private async Task WarmFrontendAsync()
    {
        var baseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL");
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return;
        }

        var url = $"{baseUrl.TrimEnd('/')}/reception/login";
        try
        {
            using var res = await Http.GetAsync(url);
            // Drain the body so the SSR render actually completes (and the
            // connection can be reused) rather than being cancelled early.
            await res.Content.ReadAsByteArrayAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[KeepWarm] Frontend warm-up ping failed.");
        }
    }
}
