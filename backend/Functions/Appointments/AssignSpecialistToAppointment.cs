using backend.Data;
using backend.DTOs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace backend.Functions.Appointments;

/// <summary>
/// Sets or clears the specialist on an existing appointment. Used when the
/// receptionist saves a booking without a specialist and assigns one later
/// based on availability.
/// </summary>
public class AssignSpecialistToAppointment
{
    private readonly SalonDbContext _context;

    public AssignSpecialistToAppointment(SalonDbContext context)
    {
        _context = context;
    }

    [Function("AssignSpecialistToAppointment")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "appointments/{id}/assign-specialist")]
        HttpRequestData req,
        long id)
    {
        var dto = await req.ReadFromJsonAsync<AssignSpecialistDto>();

        if (dto == null)
        {
            return req.CreateResponse(HttpStatusCode.BadRequest);
        }

        var appointment = await _context.Appointments
            .FirstOrDefaultAsync(x => x.Id == id);

        if (appointment == null)
        {
            return req.CreateResponse(HttpStatusCode.NotFound);
        }

        if (dto.StaffId.HasValue)
        {
            var staffExists = await _context.Staff.AnyAsync(s => s.Id == dto.StaffId.Value);
            if (!staffExists)
            {
                var bad = req.CreateResponse(HttpStatusCode.BadRequest);
                await bad.WriteStringAsync("Specialist not found.");
                return bad;
            }
        }

        appointment.StaffId = dto.StaffId;

        await _context.SaveChangesAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(appointment);
        return response;
    }
}
