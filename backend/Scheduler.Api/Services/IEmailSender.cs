namespace Scheduler.Api.Services;

/// <summary>
/// Sends one plain-text message. Deliberately knows nothing about appointments,
/// which is what makes the provider swappable by configuration alone.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}
