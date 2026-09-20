using Scheduler.Api.DTOs;

namespace Scheduler.Api.Services;

public enum AppointmentStatus
{
    Success,

    /// <summary>No such appointment, OR it belongs to someone else. The caller
    /// cannot tell which, and that is deliberate (FR-028).</summary>
    NotFound,

    /// <summary>End time is not strictly after start time.</summary>
    InvalidTimes,

    /// <summary>The requested range ends before it begins.</summary>
    InvalidRange
}

public record AppointmentResult(AppointmentStatus Status, AppointmentResponse? Response);

public record AppointmentListResult(AppointmentStatus Status, IReadOnlyList<AppointmentResponse> Items);

/// <summary>
/// Every method takes the acting user's id as its FIRST parameter, so ownership is
/// visible in every signature and impossible to forget (Article VI).
/// </summary>
public interface IAppointmentService
{
    Task<AppointmentListResult> GetRangeAsync(Guid userId, DateOnly from, DateOnly to);
    Task<AppointmentResult> CreateAsync(Guid userId, AppointmentRequest request);
    Task<AppointmentResult> UpdateAsync(Guid userId, Guid id, AppointmentRequest request);
    Task<AppointmentStatus> DeleteAsync(Guid userId, Guid id);
}
