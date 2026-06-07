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
/// Note: this mitigates — but does not guarantee removal of — cold starts on
/// the Consumption plan (e.g. after a deploy or a scale-out). For a hard
/// guarantee move to Flex Consumption with always-ready instances.
/// </summary>
public class KeepWarm
{
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
            _logger.LogWarning(ex, "[KeepWarm] Warm-up ping failed.");
        }
    }
}
