using backend.Data;
using backend.DTOs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Appointments;

/// <summary>
/// Closes an appointment. Default status is "Done" with payment captured;
/// "NoShow" / "Cancelled" close it without payment.
/// </summary>
public class MarkAppointmentDone
{
    private readonly SalonDbContext _context;

    public MarkAppointmentDone(SalonDbContext context)
    {
        _context = context;
    }

    [Function("MarkAppointmentDone")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "appointments/{id}/done")]
        HttpRequestData req,
        long id)
    {
        var dto = await req.ReadFromJsonAsync<MarkAppointmentDoneDto>() ?? new MarkAppointmentDoneDto();

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (appointment == null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        var status = string.IsNullOrWhiteSpace(dto.Status) ? "Done" : dto.Status;

        appointment.Status = status;
        appointment.CompletedAt = DateTime.UtcNow;

        if (status == "Done")
        {
            appointment.AmountPaid = dto.AmountPaid;
            appointment.PaymentMethod = dto.PaymentMethod;
        }

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);

        await response.WriteAsJsonAsync(appointment);

        return response;
    }
}
