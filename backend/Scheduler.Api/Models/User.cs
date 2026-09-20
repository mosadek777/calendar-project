namespace Scheduler.Api.Models;

/// <summary>
/// An account holder. Never returned to a client — DTOs only (Article V).
/// </summary>
public class User
{
    public Guid Id { get; set; }

    /// <summary>Stored lower-cased. Unique index enforced in SchedulerDbContext.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Output of PasswordHasher&lt;User&gt;.HashPassword. Never serialized, never logged,
    /// never compared with ==.
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
