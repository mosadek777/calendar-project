namespace Scheduler.Api.DTOs;

/// <summary>
/// A failed send is reported as Sent=false with a message, not as a 500: the
/// request was valid and nothing broke (FR-026).
/// </summary>
public record EmailResultResponse(bool Sent, string Message);
