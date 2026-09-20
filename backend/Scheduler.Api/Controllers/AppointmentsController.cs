using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Scheduler.Api.DTOs;
using Scheduler.Api.Services;

namespace Scheduler.Api.Controllers;

/// <summary>
/// Every action is protected. An anonymous or expired request is refused by
/// middleware before any of this runs.
/// </summary>
[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointments;

    public AppointmentsController(IAppointmentService appointments)
    {
        _appointments = appointments;
    }

    /// <summary>
    /// One range endpoint serving three screens: the month's marks, the selected
    /// day's list, and today's agenda.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRange([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        var result = await _appointments.GetRangeAsync(User.GetUserId(), from, to);

        return result.Status == AppointmentStatus.InvalidRange
            ? Problem(
                title: "Invalid range",
                detail: "The 'to' date must not be earlier than the 'from' date.",
                statusCode: StatusCodes.Status400BadRequest)
            : Ok(result.Items);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(AppointmentRequest request)
    {
        var result = await _appointments.CreateAsync(User.GetUserId(), request);

        return result.Status switch
        {
            AppointmentStatus.Success => Created($"/api/appointments/{result.Response!.Id}", result.Response),
            _ => InvalidTimes()
        };
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, AppointmentRequest request)
    {
        var result = await _appointments.UpdateAsync(User.GetUserId(), id, request);

        return result.Status switch
        {
            AppointmentStatus.Success => Ok(result.Response),
            AppointmentStatus.NotFound => NotFoundProblem(),
            _ => InvalidTimes()
        };
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var status = await _appointments.DeleteAsync(User.GetUserId(), id);

        return status == AppointmentStatus.Success ? NoContent() : NotFoundProblem();
    }

    private ObjectResult InvalidTimes() => Problem(
        title: "Invalid times",
        detail: "End time must be after start time.",
        statusCode: StatusCodes.Status400BadRequest);

    /// <summary>
    /// 404, never 403. A 403 would confirm that someone else's appointment exists.
    /// </summary>
    private ObjectResult NotFoundProblem() => Problem(
        title: "Not found",
        detail: "No such appointment.",
        statusCode: StatusCodes.Status404NotFound);
}
