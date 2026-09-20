namespace Scheduler.Api.Models;

/// <summary>
/// One commitment belonging to exactly one user. DateOnly + TimeOnly on a single
/// day makes crossing midnight structurally impossible rather than a rule to check.
/// </summary>
public class Appointment
{
    public Guid Id { get; set; }

    /// <summary>Set from the token's claim. Never bound from a request body.</summary>
    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public DateOnly Date { get; set; }

    public TimeOnly StartTime { get; set; }

    /// <summary>Strictly later than StartTime — enforced in AppointmentService.</summary>
    public TimeOnly EndTime { get; set; }

    /// <summary>Set on create, never changed by an edit.</summary>
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
