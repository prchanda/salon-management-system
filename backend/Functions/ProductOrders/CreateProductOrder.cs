using backend.Data;
using backend.DTOs;
using backend.Entities;
using backend.Helpers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.RegularExpressions;

namespace backend.Functions.ProductOrders;

public class CreateProductOrder
{
    private const int MaxName = 120;
    private const int MaxAddress = 500;
    private const int MaxNotes = 1000;
    private const int MaxQuantity = 50;

    private readonly SalonDbContext _context;

    public CreateProductOrder(SalonDbContext context)
    {
        _context = context;
    }

    /// <summary>Public — a customer places an order for a single product.</summary>
    [Function("CreateProductOrder")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "product-orders")]
        HttpRequestData req)
    {
        var dto = await req.ReadFromJsonAsync<CreateProductOrderDto>();
        if (dto is null) return await Bad(req, "Request body is required.");

        // Honeypot — silently accept and discard if a bot fills the hidden field.
        if (!string.IsNullOrWhiteSpace(dto.Website))
        {
            return req.CreateResponse(HttpStatusCode.Created);
        }

        var name = (dto.CustomerName ?? string.Empty).Trim();
        var phone = (dto.CustomerPhone ?? string.Empty).Trim();
        var email = (dto.CustomerEmail ?? string.Empty).Trim();
        var address = (dto.DeliveryAddress ?? string.Empty).Trim();
        var notes = (dto.Notes ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length > MaxName)
            return await Bad(req, $"customerName is required (max {MaxName} chars).");
        if (string.IsNullOrWhiteSpace(phone))
            return await Bad(req, "customerPhone is required.");

        // Phone must be exactly 10 numeric digits.
        if (!Regex.IsMatch(phone, @"^\d{10}$"))
            return await Bad(req, "customerPhone must be exactly 10 digits.");

        if (email.Length > 0 && !Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return await Bad(req, "customerEmail is not a valid email address.");

        if (address.Length > MaxAddress)
            return await Bad(req, $"deliveryAddress must be {MaxAddress} chars or fewer.");
        if (notes.Length > MaxNotes)
            return await Bad(req, $"notes must be {MaxNotes} chars or fewer.");

        if (dto.ProductId is null || dto.ProductId <= 0)
            return await Bad(req, "productId is required.");
        if (dto.Quantity is null || dto.Quantity < 1 || dto.Quantity > MaxQuantity)
            return await Bad(req, $"quantity must be between 1 and {MaxQuantity}.");

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId.Value && p.IsActive);
        if (product is null)
            return await Bad(req, "The selected product is no longer available.");

        if (product.StockQuantity.HasValue && product.StockQuantity.Value < dto.Quantity.Value)
            return await Bad(req,
                product.StockQuantity.Value == 0
                    ? "This product is out of stock."
                    : $"Only {product.StockQuantity.Value} unit(s) of this product are in stock.");

        var now = DateTime.UtcNow;
        var quantity = dto.Quantity.Value;
        var unitPrice = product.Price;

        var order = new ProductOrder
        {
            CustomerName = name,
            CustomerPhone = phone,
            CustomerEmail = string.IsNullOrWhiteSpace(email) ? null : email,
            DeliveryAddress = string.IsNullOrWhiteSpace(address) ? null : address,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes,
            ProductId = product.Id,
            ProductName = product.Name,
            UnitPrice = unitPrice,
            Quantity = quantity,
            TotalAmount = unitPrice * quantity,
            Status = "Pending",
            CreatedAt = now,
            UpdatedAt = now,
        };

        _context.ProductOrders.Add(order);

        // Decrement tracked stock so the next customer sees an accurate count.
        if (product.StockQuantity.HasValue)
        {
            product.StockQuantity = product.StockQuantity.Value - quantity;
            product.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();

        // Best-effort owner notification. Runs after the order is safely
        // persisted and swallows its own failures, so it never blocks or fails
        // the order.
        await OwnerNotifier.NotifyNewProductOrderAsync(_context, order);

        var response = req.CreateResponse(HttpStatusCode.Created);
        await response.WriteAsJsonAsync(order);
        return response;
    }

    private static async Task<HttpResponseData> Bad(HttpRequestData req, string message)
    {
        var resp = req.CreateResponse(HttpStatusCode.BadRequest);
        await resp.WriteStringAsync(message);
        return resp;
    }
}
