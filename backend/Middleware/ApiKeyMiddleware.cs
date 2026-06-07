using System.Net;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.Functions.Worker.Middleware;

namespace backend.Middleware;

/// <summary>
/// Gatekeeper for privileged endpoints. Public endpoints (see
/// <see cref="PublicEndpoints"/>) are always allowed. Every other HTTP request
/// must present the shared secret in the <c>X-Api-Key</c> header, matching the
/// <c>BACKEND_API_KEY</c> app setting.
///
/// The Next.js frontend injects this key server-side only — browser code reaches
/// privileged endpoints through a same-origin proxy that adds the header after
/// verifying the reception session — so the secret is never exposed publicly.
///
/// Fail-open behaviour: when <c>BACKEND_API_KEY</c> is not configured the
/// middleware allows all requests (and logs a warning). This keeps the API
/// working during a staged rollout; protection activates the moment the key is
/// set on both the backend and the frontend.
/// </summary>
public class ApiKeyMiddleware : IFunctionsWorkerMiddleware
{
    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        var req = await context.GetHttpRequestDataAsync();

        // Non-HTTP triggers (none today, but be safe) have no request.
        if (req is null)
        {
            await next(context);
            return;
        }

        if (PublicEndpoints.IsPublic(req.Method, req.Url.AbsolutePath))
        {
            await next(context);
            return;
        }

        var expected = Environment.GetEnvironmentVariable("BACKEND_API_KEY");
        if (string.IsNullOrEmpty(expected))
        {
            // Not configured yet — fail open so the site keeps working, but make
            // the gap loud in the logs.
            Console.Error.WriteLine(
                "[ApiKeyMiddleware] BACKEND_API_KEY is not set; privileged endpoints are UNPROTECTED. " +
                "Set the app setting to enable API-key enforcement.");
            await next(context);
            return;
        }

        var provided = GetHeader(req, "X-Api-Key");
        if (provided is not null && FixedTimeEquals(provided, expected))
        {
            await next(context);
            return;
        }

        var response = req.CreateResponse(HttpStatusCode.Unauthorized);
        await response.WriteStringAsync("Unauthorized");
        context.GetInvocationResult().Value = response;
    }

    private static string? GetHeader(HttpRequestData req, string name)
    {
        if (req.Headers.TryGetValues(name, out var values))
        {
            return values.FirstOrDefault();
        }
        return null;
    }

    private static bool FixedTimeEquals(string a, string b)
    {
        var ba = System.Text.Encoding.UTF8.GetBytes(a);
        var bb = System.Text.Encoding.UTF8.GetBytes(b);
        return System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(ba, bb);
    }
}
