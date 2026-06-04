using backend.Data;
using backend.DTOs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Customers;

/// <summary>
/// Merges a duplicate customer into a target customer. The target ({id}) is the
/// record to keep; the source (body) is the duplicate to remove. Appointments
/// are reassigned to the target, missing target contact fields are back-filled
/// from the source, and the source record is deleted. Used by reception to clean
/// up duplicates that arise when the same guest books under a second phone number.
/// </summary>
public class MergeCustomers
{
    private readonly SalonDbContext _context;

    public MergeCustomers(SalonDbContext context)
    {
        _context = context;
    }

    [Function("MergeCustomers")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "customers/{id}/merge")]
        HttpRequestData req,
        long id)
    {
        var dto = await req.ReadFromJsonAsync<MergeCustomersDto>();

        if (dto == null || dto.SourceCustomerId == 0)
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteStringAsync("sourceCustomerId is required.");
            return bad;
        }

        if (dto.SourceCustomerId == id)
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteStringAsync("Cannot merge a customer into itself.");
            return bad;
        }

        var target = await _context.Customers
            .FirstOrDefaultAsync(x => x.Id == id);

        if (target == null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteStringAsync("Target customer not found.");
            return notFound;
        }

        var source = await _context.Customers
            .FirstOrDefaultAsync(x => x.Id == dto.SourceCustomerId);

        if (source == null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteStringAsync("Source customer not found.");
            return notFound;
        }

        // Reassign every appointment from the duplicate onto the kept record.
        var sourceAppointments = await _context.Appointments
            .Where(x => x.CustomerId == source.Id)
            .ToListAsync();

        foreach (var appointment in sourceAppointments)
        {
            appointment.CustomerId = target.Id;
        }

        // Back-fill any contact details the target is missing. The source is
        // deleted in the same transaction, so copying its phone number cannot
        // violate the unique phone index.
        if (string.IsNullOrWhiteSpace(target.PhoneNumber) &&
            !string.IsNullOrWhiteSpace(source.PhoneNumber))
        {
            target.PhoneNumber = source.PhoneNumber;
        }

        if (string.IsNullOrWhiteSpace(target.Email) &&
            !string.IsNullOrWhiteSpace(source.Email))
        {
            target.Email = source.Email;
        }

        if (string.IsNullOrWhiteSpace(target.Gender) &&
            !string.IsNullOrWhiteSpace(source.Gender))
        {
            target.Gender = source.Gender;
        }

        if (target.DateOfBirth == null && source.DateOfBirth != null)
        {
            target.DateOfBirth = source.DateOfBirth;
        }

        // Preserve both notes so nothing the team wrote down is lost.
        if (!string.IsNullOrWhiteSpace(source.Notes))
        {
            target.Notes = string.IsNullOrWhiteSpace(target.Notes)
                ? source.Notes
                : $"{target.Notes}\n\n{source.Notes}";
        }

        _context.Customers.Remove(source);

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(new
        {
            Customer = target,
            MergedAppointmentCount = sourceAppointments.Count,
            RemovedCustomerId = source.Id
        });

        return response;
    }
}
