using System.ComponentModel.DataAnnotations;

namespace Scheduler.Api.DTOs;

/// <summary>
/// Used by both create and update. There is no user id property, so a client has
/// nothing to spoof — ownership comes from the token alone (FR-027).
/// </summary>
public class AppointmentRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    /// <summary>
    /// Must be strictly later than StartTime. That rule cannot be expressed as an
    /// annotation, so it lives in AppointmentService and is shared by create and update.
    /// </summary>
    [Required]
    public TimeOnly EndTime { get; set; }
}
