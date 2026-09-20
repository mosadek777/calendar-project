namespace Scheduler.Api.DTOs;

/// <summary>
/// What a client sees. There is deliberately no UserId here: it is not useful to
/// the caller and not safe to normalize returning (Article V).
/// </summary>
public record AppointmentResponse(
    Guid Id,
    string Title,
    string? Notes,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    DateTime CreatedAt);
