using backend.Data;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
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

    private readonly SalonDbContext _context;
    private readonly ILogger<KeepWarm> _logger;

    public KeepWarm(SalonDbContext context, ILogger<KeepWarm> logger)
    {
        _context = context;
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

        await WarmFrontendAsync();
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
