using backend.Data;
using backend.DTOs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.ProductOrders;

public class UpdateProductOrderStatus
{
    // Order lifecycle (state machine):
    //   Pending   → Confirmed (action: "confirm") | Cancelled (action: "cancel")
    //   Confirmed → Completed (action: "complete") | Cancelled (action: "cancel")
    //   Completed → (terminal)
    //   Cancelled → (terminal)
    //
    // Stock is decremented at order placement. Cancellation restores it.
    // Because Cancelled and Completed are terminal, there is no "un-cancel"
    // path and therefore no need to re-deduct stock here.
    private static readonly Dictionary<string, (string Action, string Target)[]> Transitions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Pending"] = new[]
            {
                ("confirm", "Confirmed"),
                ("cancel",  "Cancelled"),
            },
            ["Confirmed"] = new[]
            {
                ("complete", "Completed"),
                ("cancel",   "Cancelled"),
            },
            ["Completed"] = Array.Empty<(string, string)>(),
            ["Cancelled"] = Array.Empty<(string, string)>(),
        };

    private readonly SalonDbContext _context;

    public UpdateProductOrderStatus(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Reception — advance a retail order through its lifecycle.</summary>
    [Function("UpdateProductOrderStatus")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "product-orders/{id:long}/status")]
        HttpRequestData req,
        long id)
    {
        var order = await _context.ProductOrders.FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return req.CreateResponse(HttpStatusCode.NotFound);

        var dto = await req.ReadFromJsonAsync<UpdateProductOrderStatusDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        // Resolve the desired target either from an explicit action (preferred)
        // or — for backwards compatibility — from a literal status string.
        var actionRaw = (dto.Action ?? string.Empty).Trim();
        var statusRaw = (dto.Status ?? string.Empty).Trim();
        if (actionRaw.Length == 0 && statusRaw.Length == 0)
            return await Bad(req, "Provide an `action` (confirm | complete | cancel).");

        if (!Transitions.TryGetValue(order.Status, out var allowed))
            return await Conflict(req, $"Unknown current status '{order.Status}'.");

        (string Action, string Target)? match = null;
        if (actionRaw.Length > 0)
        {
            foreach (var t in allowed)
            {
                if (string.Equals(t.Action, actionRaw, StringComparison.OrdinalIgnoreCase))
                {
                    match = t;
                    break;
                }
            }
        }
        else
        {
            // Legacy: a status string was supplied. Treat it as a target and
            // find a matching transition.
            foreach (var t in allowed)
            {
                if (string.Equals(t.Target, statusRaw, StringComparison.OrdinalIgnoreCase))
                {
                    match = t;
                    break;
                }
            }
        }

        if (match is null)
        {
            if (allowed.Length == 0)
                return await Conflict(req,
                    $"Order is already {order.Status.ToLowerInvariant()} — no further changes are allowed.");

            var actionList = string.Join(", ", allowed.Select(a => a.Action));
            return await Conflict(req,
                $"From '{order.Status}' the only allowed actions are: {actionList}.");
        }

        var target = match.Value.Target;
        var now = DateTime.UtcNow;

        // Restore stock if this transition cancels a previously live order.
        if (string.Equals(target, "Cancelled", StringComparison.OrdinalIgnoreCase) && order.ProductId.HasValue)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == order.ProductId);
            if (product is not null && product.StockQuantity.HasValue)
            {
                product.StockQuantity = product.StockQuantity.Value + order.Quantity;
                product.UpdatedAt = now;
            }
        }

        // Capture payment details when the sale is completed. The amount may be
        // lower than the listed total when reception grants a discount.
        if (string.Equals(target, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            order.AmountPaid = dto.AmountPaid.HasValue && dto.AmountPaid.Value >= 0
                ? dto.AmountPaid.Value
                : order.TotalAmount;

            var method = (dto.PaymentMethod ?? string.Empty).Trim();
            order.PaymentMethod = method.Length > 0 ? method : null;
        }

        order.Status = target;
        order.UpdatedAt = now;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(order);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }

    private static async Task<HttpResponseData> Conflict(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.Conflict);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
